import React, { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { Loader } from '../components/Loader'
import { UserService } from '../services/userService'
import type { User } from '../types/api'
import './AdminUsersPage.css'

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    latitude: '',
    longitude: ''
  })

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        const allUsers = await UserService.getAllUsers()
        setUsers(allUsers)
      } catch (err: any) {
        setError(err.message || 'Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      setLoading(true)
      await UserService.deleteUser(userId)
      setUsers(users.filter(user => user.id !== userId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    console.log('Editing user:', user)
    setEditingUser(user)
    const isAdmin = user.roles?.includes('ROLE_ADMIN') || false
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '', // Clear password when editing
      role: isAdmin ? 'admin' : 'user',
      latitude: user.location?.latitude?.toString() || '',
      longitude: user.location?.longitude?.toString() || ''
    })
    setShowCreateForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'user',
      latitude: '',
      longitude: ''
    })
    setEditingUser(null)
    setShowCreateForm(false)
  }

  const handleAddNew = () => {
    resetForm()
    setShowCreateForm(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)

      // Add location if provided
      const location: any = {}
      if (formData.latitude && formData.longitude) {
        location.latitude = parseFloat(formData.latitude)
        location.longitude = parseFloat(formData.longitude)
      }

      if (editingUser) {
        // Update existing user
        const userData: any = {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          ...location
        }

        console.log('Updating user:', editingUser.id, userData)
        const updated = await UserService.updateUser(editingUser.id, userData)
        console.log('Update response:', updated)

        if (updated) {
          const refreshedUsers = await UserService.getAllUsers()
          setUsers(refreshedUsers)
          resetForm()
        } else {
          throw new Error('Failed to update user')
        }
      } else {
        // Create new user
        if (!formData.email || !formData.password) {
          setError('Email and password are required for new users')
          setLoading(false)
          return
        }

        const userData: any = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          ...location
        }

        console.log('Creating user:', userData)
        const created = await UserService.createUser(userData)
        console.log('Create response:', created)

        if (created) {
          const refreshedUsers = await UserService.getAllUsers()
          setUsers(refreshedUsers)
          resetForm()
        } else {
          throw new Error('Failed to create user')
        }
      }
    } catch (err: any) {
      console.error('Save user error:', err)
      setError(err.message || err.error || 'Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (roles?: string[]) => {
    if (!roles || roles.length === 0) return 'User'
    
    const isAdmin = roles.includes('ROLE_ADMIN')
    return isAdmin ? 'Admin' : 'User'
  }

  const getRoleColor = (roles?: string[]) => {
    if (!roles || roles.length === 0) return 'secondary'
    
    const isAdmin = roles.includes('ROLE_ADMIN')
    return isAdmin ? 'primary' : 'secondary'
  }

  const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <Card className="user-card" hover>
      <div className="user-header">
        <div className="user-info">
          <h3>{user.name}</h3>
          <span className={`role-badge ${getRoleColor(user.roles)}`}>
            {getRoleBadge(user.roles)}
          </span>
        </div>
        <div className="user-id">ID: #{user.id}</div>
      </div>

      <div className="user-details">
        <div className="detail-row">
          <span className="detail-label">Email:</span>
          <span className="detail-value">{user.email}</span>
        </div>
        
        {user.phone && (
          <div className="detail-row">
            <span className="detail-label">Phone:</span>
            <span className="detail-value">{user.phone}</span>
          </div>
        )}
        
        <div className="detail-row">
          <span className="detail-label">Created:</span>
          <span className="detail-value">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>

        {user.location && (
          <div className="detail-row">
            <span className="detail-label">Location:</span>
            <span className="detail-value">
              {user.location.latitude.toFixed(4)}, {user.location.longitude.toFixed(4)}
            </span>
          </div>
        )}
      </div>

      <div className="user-actions">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => handleEditUser(user)}
        >
          Edit
        </Button>
        <Button 
          variant="danger" 
          size="sm"
          onClick={() => handleDeleteUser(user.id)}
          disabled={loading}
        >
          Delete
        </Button>
      </div>
    </Card>
  )

  if (loading && users.length === 0) {
    return (
      <div className="admin-users-page">
        <div className="loading-container">
          <Loader size="lg" message="Loading users..." />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage system users and their permissions</p>
        <Button 
          variant="primary"
          onClick={showCreateForm ? resetForm : handleAddNew}
        >
          {showCreateForm ? 'Cancel' : 'Add New User'}
        </Button>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {showCreateForm && (
        <Card className="user-form">
          <h3>{editingUser ? `Edit User #${editingUser.id}` : 'Create New User'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                />
              </div>

              {!editingUser && (
                <>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="user@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password *</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </>
              )}

              {editingUser && (
                <div className="form-group readonly">
                  <label>Email</label>
                  <input type="text" value={editingUser.email} disabled />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="user">Regular User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="latitude">Latitude</label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="36.8065"
                  step="any"
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitude">Longitude</label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="10.1815"
                  step="any"
                />
              </div>
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Loader size="sm" /> : (editingUser ? 'Update User' : 'Create User')}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="users-stats">
        <Card>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{users.length}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {users.filter(u => u.roles?.includes('ROLE_ADMIN')).length}
              </div>
              <div className="stat-label">Administrators</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                {users.filter(u => !u.roles?.includes('ROLE_ADMIN')).length}
              </div>
              <div className="stat-label">Regular Users</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="users-list">
        {users.length > 0 ? (
          users.map(user => (
            <UserCard key={user.id} user={user} />
          ))
        ) : (
          <Card>
            <div className="no-users">
              <h3>No users found</h3>
              <p>No users have been registered in the system yet.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
