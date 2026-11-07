import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const emptyForm = { name: '', title: '' }

function App() {
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadEmployees = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/api/employees`)
      if (!response.ok) throw new Error('Unable to load employees')
      setEmployees(await response.json())
    } catch (requestError) {
      setError(`${requestError.message}. Check that the backend is running.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    fetch(`${API_URL}/api/employees`)
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load employees')
        return response.json()
      })
      .then((data) => {
        if (!ignore) setEmployees(data)
      })
      .catch((requestError) => {
        if (!ignore) setError(`${requestError.message}. Check that the backend is running.`)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const endpoint = editingId ? `${API_URL}/api/employees/${editingId}` : `${API_URL}/api/employees`

    try {
      const response = await fetch(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to save employee')

      if (editingId) {
        setEmployees((currentEmployees) => currentEmployees.map((employee) => (
          employee.id === editingId ? result : employee
        )))
      } else {
        setEmployees((currentEmployees) => [result, ...currentEmployees])
      }
      resetForm()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (employee) => {
    setEditingId(employee.id)
    setForm({ name: employee.name, title: employee.title })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Delete this employee?')) return
    setError('')
    try {
      const response = await fetch(`${API_URL}/api/employees/${employeeId}`, { method: 'DELETE' })
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Unable to delete employee')
      }
      setEmployees((currentEmployees) => currentEmployees.filter((employee) => employee.id !== employeeId))
      if (editingId === employeeId) resetForm()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">EM</div>
        <div><p className="eyebrow">People operations</p><p className="brand-name">Employee directory</p></div>
        <div className="connection-status"><span /> API connected</div>
      </header>

      <section className="page-heading">
        <div><p className="eyebrow">Workspace / Directory</p><h1>Meet the team.</h1><p className="heading-copy">Keep names and roles current in one clear, shared view.</p></div>
        <div className="employee-count"><strong>{employees.length}</strong><span>{employees.length === 1 ? 'employee' : 'employees'}</span></div>
      </section>

      {error && <div className="alert" role="alert">{error}</div>}

      <section className="workspace">
        <form className="employee-form" onSubmit={handleSubmit}>
          <div className="form-header"><div className="form-icon" aria-hidden="true">{editingId ? 'ED' : '+'}</div><div><p className="eyebrow">{editingId ? 'Update record' : 'New record'}</p><h2>{editingId ? 'Edit employee' : 'Add employee'}</h2></div></div>
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Maya Chen" maxLength="120" required />
          <label htmlFor="title">Job title</label>
          <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Product designer" maxLength="160" required />
          <div className="form-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add employee'}</button>{editingId && <button className="quiet-button" type="button" onClick={resetForm}>Cancel</button>}</div>
        </form>

        <section className="directory-panel" aria-labelledby="directory-title">
          <div className="panel-heading"><div><p className="eyebrow">Current team</p><h2 id="directory-title">Directory</h2></div><button className="refresh-button" type="button" onClick={loadEmployees} disabled={loading} title="Refresh employees" aria-label="Refresh employees">↻</button></div>
          {loading ? <div className="empty-state"><span className="loader" />Loading employees...</div> : employees.length === 0 ? <div className="empty-state"><strong>No employees yet.</strong><span>Add the first person using the form.</span></div> : <div className="employee-list">{employees.map((employee, index) => <article className="employee-row" key={employee.id}><div className={`avatar avatar-${index % 4}`}>{employee.name.charAt(0).toUpperCase()}</div><div className="employee-info"><strong>{employee.name}</strong><span>{employee.title}</span></div><div className="row-actions"><button type="button" onClick={() => handleEdit(employee)}>Edit</button><button type="button" className="delete-action" onClick={() => handleDelete(employee.id)}>Delete</button></div></article>)}</div>}
        </section>
      </section>
    </main>
  )
}

export default App
