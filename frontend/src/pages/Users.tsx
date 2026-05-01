import React from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { UserService } from '../services/userService'
import type { User } from '../types/api'
import './Users.css'

export const Users: React.FC = () => {
  const [user, setUser] = React.useState<User | null>(null)
  const [allUsers, setAllUsers] = React.useState<User[] | null>(null)
  const [searchEmail, setSearchEmail] = React.useState('')
  const [userSearchResult, setUserSearchResult] = React.useState<User | null>(null)
  const [status, setStatus] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')

  React.useEffect(() => {
    setLoading(true)
    UserService.getCurrentUser()
      .then((user) => {
        if (user) {
          setUser(user)
          setName(user.name || '')
          setPhone(user.phone || '')
        }
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const handleUpdate = async () => {
    setLoading(true)
    const user = await UserService.updateCurrentUser({ name, phone })
    if (user) {
      setUser(user)
      setStatus('Profile updated successfully')
    } else {
      setError('Update failed')
    }
    setLoading(false)
  }

  const handleLoadAllUsers = async () => {
    setLoading(true)
    const users = await UserService.getAllUsers()
    setAllUsers(users)
    setLoading(false)
  }

  const handleSearchEmail = async () => {
    setLoading(true)
    const user = await UserService.searchByEmail(searchEmail)
    setUserSearchResult(user)
    if (!user) {
      setError('User not found')
    }
    setLoading(false)
  }

  return (
    <div className="page-container">
      <div className="users-grid">
        <Card title="My Profile" hover>
          {loading && <Loader message="Loading user profile..." />}
          {status && <Alert type="success" message={status} onClose={() => setStatus(null)} />}
          {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

          {user ? (
            <div>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Phone:</strong> {user.phone || 'Not set'}</p>
              <p><strong>Roles:</strong> {user.roles?.join(', ') || 'n/a'}</p>
              <div className="form-group">
                <label>Update name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Update phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Button variant="primary" onClick={handleUpdate}>Save profile</Button>
            </div>
          ) : (
            <p>No authenticated user found. Login through the Auth page first.</p>
          )}
        </Card>

        <Card title="User Search" hover>
          <div className="form-group">
            <label>Search by email</label>
            <input value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder="user@example.com" />
          </div>
          <Button variant="primary" onClick={handleSearchEmail}>Search</Button>
          {userSearchResult && (
            <div className="detail-block">
              <h3>{userSearchResult.name}</h3>
              <p>{userSearchResult.email}</p>
            </div>
          )}
        </Card>

        <Card title="Users List" hover>
          <Button variant="secondary" onClick={handleLoadAllUsers}>Load All Users</Button>
          {allUsers && allUsers.length > 0 && (
            <ul className="list-section">
              {allUsers.map((u) => (
                <li key={u.id}>{u.name} — {u.email} — {u.roles?.join(', ') || 'user'}</li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
