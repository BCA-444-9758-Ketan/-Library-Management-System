import { useEffect, useMemo, useState } from 'react'
import { api, API_BASE_URL } from './api/client'
import './App.css'

const SESSION_KEY = 'smartlib_session_v1'

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return { token: '', user: null }
    const parsed = JSON.parse(raw)

    if (!parsed?.token || !parsed?.user) {
      return { token: '', user: null }
    }

    return parsed
  } catch {
    return { token: '', user: null }
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

function numberOrUndefined(value) {
  if (value === '' || value === undefined || value === null) return undefined
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}

function App() {
  const [health, setHealth] = useState('checking')
  const [flash, setFlash] = useState({ kind: '', text: '' })

  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({
    name: '',
    email: 'admin@smartlibrary.in',
    password: 'password123',
  })

  const [session, setSession] = useState(loadSession)

  const [booksQuery, setBooksQuery] = useState({
    search: '',
    category: '',
    page: 1,
    limit: 10,
  })
  const [books, setBooks] = useState([])
  const [pagination, setPagination] = useState(null)
  const [selectedBook, setSelectedBook] = useState(null)
  const [selectedAvailability, setSelectedAvailability] = useState([])
  const [loadingBooks, setLoadingBooks] = useState(false)

  const [inventoryQuery, setInventoryQuery] = useState({
    bookId: '',
    branchId: '',
    page: 1,
    limit: 20,
  })
  const [inventoryRows, setInventoryRows] = useState([])

  const [myTransactions, setMyTransactions] = useState([])
  const [myReservations, setMyReservations] = useState([])
  const [recommendations, setRecommendations] = useState([])

  const [issueForm, setIssueForm] = useState({ bookId: '', branchId: '' })
  const [returnForm, setReturnForm] = useState({ transactionId: '', bookId: '' })
  const [reserveForm, setReserveForm] = useState({ bookId: '', branchId: '' })

  const [bookCreateForm, setBookCreateForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    description: '',
    publishedYear: '',
  })

  const [stockForm, setStockForm] = useState({ bookId: '', branchId: '', quantity: '' })
  const [transferForm, setTransferForm] = useState({
    bookId: '',
    fromBranchId: '',
    toBranchId: '',
    quantity: '',
  })

  const role = session.user?.role || ''
  const isLoggedIn = Boolean(session.token)
  const canManageBooks = role === 'ADMIN' || role === 'LIBRARIAN'
  const isAdmin = role === 'ADMIN'

  const identityLabel = useMemo(() => {
    if (!isLoggedIn) return 'Guest'
    return `${session.user.name} (${session.user.role})`
  }, [isLoggedIn, session.user])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.health()
        setHealth('up')
      } catch {
        setHealth('down')
      }
    }

    const loadInitialBooks = async () => {
      setLoadingBooks(true)
      try {
        const response = await api.getBooks({ page: 1, limit: 10 })
        setBooks(response?.data || [])
        setPagination(response?.pagination || null)
      } catch (err) {
        notify('error', err.message)
      } finally {
        setLoadingBooks(false)
      }
    }

    checkHealth()
    void loadInitialBooks()
  }, [])

  const notify = (kind, text) => setFlash({ kind, text })

  async function fetchBooks() {
    setLoadingBooks(true)
    try {
      const response = await api.getBooks(booksQuery)
      setBooks(response?.data || [])
      setPagination(response?.pagination || null)
    } catch (err) {
      notify('error', err.message)
    } finally {
      setLoadingBooks(false)
    }
  }

  async function fetchBookDetails(bookId) {
    try {
      const [bookResponse, availabilityResponse] = await Promise.all([
        api.getBookById(bookId),
        api.getBookAvailability(bookId),
      ])

      setSelectedBook(bookResponse?.data || null)
      setSelectedAvailability(availabilityResponse?.data || [])
    } catch (err) {
      notify('error', err.message)
    }
  }

  function handleLogout() {
    clearSession()
    setSession({ token: '', user: null })
    setMyTransactions([])
    setMyReservations([])
    setRecommendations([])
    setInventoryRows([])
    notify('info', 'Signed out successfully')
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()

    try {
      const payload = {
        email: authForm.email,
        password: authForm.password,
      }

      const response =
        authMode === 'register'
          ? await api.register({ ...payload, name: authForm.name })
          : await api.login(payload)

      const newSession = {
        token: response.data.token,
        user: response.data.user,
      }

      setSession(newSession)
      saveSession(newSession)
      notify('success', `${authMode === 'register' ? 'Registration' : 'Login'} successful`)

      await loadPersonalData(newSession)
    } catch (err) {
      notify('error', err.message)
    }
  }

  async function loadPersonalData(currentSession = session) {
    if (!currentSession?.token || !currentSession?.user) {
      return
    }

    try {
      const [txResponse, reservationResponse, recommendationResponse] = await Promise.all([
        api.getMyTransactions(currentSession.token),
        api.getMyReservations(currentSession.token),
        api.getRecommendations(currentSession.user.id, currentSession.token),
      ])

      setMyTransactions(txResponse?.data || [])
      setMyReservations(reservationResponse?.data || [])
      setRecommendations(recommendationResponse?.data?.recommendations || [])
    } catch (err) {
      notify('error', err.message)
    }
  }

  async function handleIssueBook(event) {
    event.preventDefault()
    try {
      await api.issueBook(
        {
          bookId: Number(issueForm.bookId),
          branchId: Number(issueForm.branchId),
        },
        session.token
      )

      notify('success', 'Book issued successfully')
      setIssueForm({ bookId: '', branchId: '' })
      await Promise.all([fetchBooks(), loadPersonalData()])
    } catch (err) {
      notify('error', err.message)
    }
  }

  async function handleReturnBook(event) {
    event.preventDefault()
    try {
      const payload = {}
      if (returnForm.transactionId) {
        payload.transactionId = Number(returnForm.transactionId)
      }
      if (returnForm.bookId) {
        payload.bookId = Number(returnForm.bookId)
      }

      await api.returnBook(payload, session.token)
      notify('success', 'Book returned successfully')
      setReturnForm({ transactionId: '', bookId: '' })
      await Promise.all([fetchBooks(), loadPersonalData()])
    } catch (err) {
      notify('error', err.message)
    }
  }

  async function handleReserveBook(event) {
    event.preventDefault()
    try {
      await api.createReservation(
        {
          bookId: Number(reserveForm.bookId),
          branchId: Number(reserveForm.branchId),
        },
        session.token
      )
      notify('success', 'Reservation created successfully')
      setReserveForm({ bookId: '', branchId: '' })
      await loadPersonalData()
    } catch (err) {
      notify('error', err.message)
    }
  }

  async function handleCreateBook(event) {
    event.preventDefault()
    try {
      await api.createBook(
        {
          title: bookCreateForm.title,
          author: bookCreateForm.author,
          isbn: bookCreateForm.isbn,
          category: bookCreateForm.category,
          description: bookCreateForm.description || undefined,
          publishedYear: numberOrUndefined(bookCreateForm.publishedYear),
        },
        session.token
      )

      notify('success', 'Book created successfully')
      setBookCreateForm({
        title: '',
        author: '',
        isbn: '',
        category: '',
        description: '',
        publishedYear: '',
      })
      await fetchBooks()
    } catch (err) {
      notify('error', err.message)
    }
  }

  async function loadInventory() {
    try {
      const response = await api.getInventory(
        {
          bookId: numberOrUndefined(inventoryQuery.bookId),
          branchId: numberOrUndefined(inventoryQuery.branchId),
          page: numberOrUndefined(inventoryQuery.page) || 1,
          limit: numberOrUndefined(inventoryQuery.limit) || 20,
        },
        session.token
      )

      setInventoryRows(response?.data || [])
      notify('success', 'Inventory loaded')
    } catch (err) {
      notify('error', err.message)
    }
  }

  async function handleInventoryFetch(event) {
    event.preventDefault()
    await loadInventory()
  }

  async function handleAddStock(event) {
    event.preventDefault()
    try {
      await api.addStock(
        {
          bookId: Number(stockForm.bookId),
          branchId: Number(stockForm.branchId),
          quantity: Number(stockForm.quantity),
        },
        session.token
      )

      notify('success', 'Stock added successfully')
      setStockForm({ bookId: '', branchId: '', quantity: '' })
      await Promise.all([loadInventory(), fetchBooks()])
    } catch (err) {
      notify('error', err.message)
    }
  }

  async function handleTransferStock(event) {
    event.preventDefault()
    try {
      await api.transferStock(
        {
          bookId: Number(transferForm.bookId),
          fromBranchId: Number(transferForm.fromBranchId),
          toBranchId: Number(transferForm.toBranchId),
          quantity: Number(transferForm.quantity),
        },
        session.token
      )

      notify('success', 'Stock transferred successfully')
      setTransferForm({ bookId: '', fromBranchId: '', toBranchId: '', quantity: '' })
      await Promise.all([loadInventory(), fetchBooks()])
    } catch (err) {
      notify('error', err.message)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Smart Distributed Library</p>
          <h1>Frontend Control Desk</h1>
          <p className="subtitle">Connected API: {API_BASE_URL}</p>
        </div>
        <div className="status-grid">
          <div className={`status-chip ${health === 'up' ? 'ok' : health === 'down' ? 'bad' : ''}`}>
            API {health}
          </div>
          <div className="status-chip neutral">{identityLabel}</div>
        </div>
      </header>

      {flash.text && <div className={`flash ${flash.kind}`}>{flash.text}</div>}

      <section className="panel auth-panel">
        <div className="panel-heading">
          <h2>Authentication</h2>
          <div className="mode-switch">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={authMode === 'login' ? 'active' : ''}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={authMode === 'register' ? 'active' : ''}
            >
              Register
            </button>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleAuthSubmit}>
          {authMode === 'register' && (
            <label>
              Name
              <input
                value={authForm.name}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={authForm.email}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>

          <div className="form-actions">
            <button type="submit">{authMode === 'register' ? 'Create account' : 'Sign in'}</button>
            {isLoggedIn && (
              <button type="button" className="ghost" onClick={handleLogout}>
                Sign out
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Books</h2>
          <button type="button" onClick={fetchBooks} disabled={loadingBooks}>
            {loadingBooks ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <form
          className="query-grid"
          onSubmit={(event) => {
            event.preventDefault()
            void fetchBooks()
          }}
        >
          <label>
            Search
            <input
              value={booksQuery.search}
              onChange={(event) => setBooksQuery((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="title, author, isbn"
            />
          </label>
          <label>
            Category
            <input
              value={booksQuery.category}
              onChange={(event) => setBooksQuery((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Computer Science"
            />
          </label>
          <label>
            Page
            <input
              type="number"
              min="1"
              value={booksQuery.page}
              onChange={(event) => setBooksQuery((prev) => ({ ...prev, page: Number(event.target.value) || 1 }))}
            />
          </label>
          <label>
            Limit
            <input
              type="number"
              min="1"
              max="50"
              value={booksQuery.limit}
              onChange={(event) => setBooksQuery((prev) => ({ ...prev, limit: Number(event.target.value) || 10 }))}
            />
          </label>
          <button type="submit">Search</button>
        </form>

        {pagination && (
          <p className="meta">
            Total {pagination.total} books | Page {pagination.page}/{pagination.totalPages}
          </p>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td>{book.id}</td>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.category}</td>
                  <td>
                    <button type="button" className="ghost" onClick={() => fetchBookDetails(book.id)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedBook && (
          <div className="details-grid">
            <article>
              <h3>{selectedBook.title}</h3>
              <p>ISBN: {selectedBook.isbn}</p>
              <p>Author: {selectedBook.author}</p>
              <p>Category: {selectedBook.category}</p>
              <p>{selectedBook.description || 'No description available.'}</p>
            </article>
            <article>
              <h3>Availability</h3>
              <ul className="availability-list">
                {selectedAvailability.map((entry) => (
                  <li key={`${entry.branchId}-${entry.branchName}`}>
                    <strong>{entry.branchName}</strong> ({entry.location})
                    <span>
                      Available {entry.availableQuantity} / {entry.totalQuantity}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        )}
      </section>

      {isLoggedIn && (
        <section className="panel split-panel">
          <article>
            <h2>Circulation</h2>
            <form className="form-grid" onSubmit={handleIssueBook}>
              <h3>Issue Book</h3>
              <label>
                Book ID
                <input
                  type="number"
                  value={issueForm.bookId}
                  onChange={(event) => setIssueForm((prev) => ({ ...prev, bookId: event.target.value }))}
                  required
                />
              </label>
              <label>
                Branch ID
                <input
                  type="number"
                  value={issueForm.branchId}
                  onChange={(event) => setIssueForm((prev) => ({ ...prev, branchId: event.target.value }))}
                  required
                />
              </label>
              <button type="submit">Issue</button>
            </form>

            <form className="form-grid" onSubmit={handleReturnBook}>
              <h3>Return Book</h3>
              <label>
                Transaction ID (preferred)
                <input
                  type="number"
                  value={returnForm.transactionId}
                  onChange={(event) => setReturnForm((prev) => ({ ...prev, transactionId: event.target.value }))}
                />
              </label>
              <label>
                Book ID (optional fallback)
                <input
                  type="number"
                  value={returnForm.bookId}
                  onChange={(event) => setReturnForm((prev) => ({ ...prev, bookId: event.target.value }))}
                />
              </label>
              <button type="submit">Return</button>
            </form>

            <form className="form-grid" onSubmit={handleReserveBook}>
              <h3>Reserve Book</h3>
              <label>
                Book ID
                <input
                  type="number"
                  value={reserveForm.bookId}
                  onChange={(event) => setReserveForm((prev) => ({ ...prev, bookId: event.target.value }))}
                  required
                />
              </label>
              <label>
                Branch ID
                <input
                  type="number"
                  value={reserveForm.branchId}
                  onChange={(event) => setReserveForm((prev) => ({ ...prev, branchId: event.target.value }))}
                  required
                />
              </label>
              <button type="submit">Reserve</button>
            </form>

            <div className="form-actions">
              <button type="button" className="ghost" onClick={() => loadPersonalData()}>
                Refresh My Data
              </button>
            </div>
          </article>

          <article>
            <h2>My Dashboard</h2>
            <p className="meta">Transactions: {myTransactions.length}</p>
            <p className="meta">Reservations: {myReservations.length}</p>
            <p className="meta">Recommendations: {recommendations.length}</p>

            <div className="table-wrap compact">
              <table>
                <thead>
                  <tr>
                    <th>TX ID</th>
                    <th>Book</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myTransactions.slice(0, 8).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.book?.title}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {canManageBooks && (
        <section className="panel">
          <h2>Catalog Management (Admin/Librarian)</h2>
          <form className="form-grid multi" onSubmit={handleCreateBook}>
            <label>
              Title
              <input
                value={bookCreateForm.title}
                onChange={(event) => setBookCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </label>
            <label>
              Author
              <input
                value={bookCreateForm.author}
                onChange={(event) => setBookCreateForm((prev) => ({ ...prev, author: event.target.value }))}
                required
              />
            </label>
            <label>
              ISBN
              <input
                value={bookCreateForm.isbn}
                onChange={(event) => setBookCreateForm((prev) => ({ ...prev, isbn: event.target.value }))}
                required
              />
            </label>
            <label>
              Category
              <input
                value={bookCreateForm.category}
                onChange={(event) => setBookCreateForm((prev) => ({ ...prev, category: event.target.value }))}
                required
              />
            </label>
            <label>
              Published Year
              <input
                type="number"
                value={bookCreateForm.publishedYear}
                onChange={(event) =>
                  setBookCreateForm((prev) => ({ ...prev, publishedYear: event.target.value }))
                }
              />
            </label>
            <label className="span-2">
              Description
              <input
                value={bookCreateForm.description}
                onChange={(event) =>
                  setBookCreateForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>
            <button type="submit">Create Book</button>
          </form>
        </section>
      )}

      {isAdmin && (
        <section className="panel split-panel">
          <article>
            <h2>Inventory (Admin)</h2>
            <form className="query-grid" onSubmit={handleInventoryFetch}>
              <label>
                Book ID
                <input
                  type="number"
                  value={inventoryQuery.bookId}
                  onChange={(event) =>
                    setInventoryQuery((prev) => ({ ...prev, bookId: event.target.value }))
                  }
                />
              </label>
              <label>
                Branch ID
                <input
                  type="number"
                  value={inventoryQuery.branchId}
                  onChange={(event) =>
                    setInventoryQuery((prev) => ({ ...prev, branchId: event.target.value }))
                  }
                />
              </label>
              <label>
                Page
                <input
                  type="number"
                  min="1"
                  value={inventoryQuery.page}
                  onChange={(event) =>
                    setInventoryQuery((prev) => ({ ...prev, page: event.target.value }))
                  }
                />
              </label>
              <label>
                Limit
                <input
                  type="number"
                  min="1"
                  value={inventoryQuery.limit}
                  onChange={(event) =>
                    setInventoryQuery((prev) => ({ ...prev, limit: event.target.value }))
                  }
                />
              </label>
              <button type="submit">Load Inventory</button>
            </form>

            <div className="table-wrap compact">
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Branch</th>
                    <th>Available</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.book?.title}</td>
                      <td>{row.branch?.name}</td>
                      <td>
                        {row.availableQuantity}/{row.totalQuantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article>
            <h2>Stock Operations</h2>
            <form className="form-grid" onSubmit={handleAddStock}>
              <h3>Add Stock</h3>
              <label>
                Book ID
                <input
                  type="number"
                  value={stockForm.bookId}
                  onChange={(event) => setStockForm((prev) => ({ ...prev, bookId: event.target.value }))}
                  required
                />
              </label>
              <label>
                Branch ID
                <input
                  type="number"
                  value={stockForm.branchId}
                  onChange={(event) => setStockForm((prev) => ({ ...prev, branchId: event.target.value }))}
                  required
                />
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(event) => setStockForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  required
                />
              </label>
              <button type="submit">Add Stock</button>
            </form>

            <form className="form-grid" onSubmit={handleTransferStock}>
              <h3>Transfer Stock</h3>
              <label>
                Book ID
                <input
                  type="number"
                  value={transferForm.bookId}
                  onChange={(event) =>
                    setTransferForm((prev) => ({ ...prev, bookId: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                From Branch ID
                <input
                  type="number"
                  value={transferForm.fromBranchId}
                  onChange={(event) =>
                    setTransferForm((prev) => ({ ...prev, fromBranchId: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                To Branch ID
                <input
                  type="number"
                  value={transferForm.toBranchId}
                  onChange={(event) =>
                    setTransferForm((prev) => ({ ...prev, toBranchId: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  value={transferForm.quantity}
                  onChange={(event) =>
                    setTransferForm((prev) => ({ ...prev, quantity: event.target.value }))
                  }
                  required
                />
              </label>
              <button type="submit">Transfer</button>
            </form>
          </article>
        </section>
      )}

      <footer className="footer-note">
        Built for CIMAGE Hackathon | Role-aware frontend wired to production-style API contracts.
      </footer>
    </main>
  )
}

export default App
