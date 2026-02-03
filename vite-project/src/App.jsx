import { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import './App.css';

function App() {
  // ===== STATE MANAGEMENT =====
  // Think of state as "memory" for your component - React re-renders when these change
  
  // Form inputs
  const [itemName, setItemName] = useState('');
  const [owner, setOwner] = useState('');
  const [address, setAddress] = useState(''); // NEW: Store where item is located
  
  // User authentication state
  const [user, setUser] = useState(null); // null = not logged in, object = logged in user
  
  // Items from database
  const [items, setItems] = useState([]); // Array of all items from Firebase
  const [loading, setLoading] = useState(true); // Show loading state while fetching

  // ===== AUTHENTICATION =====
  // useEffect runs when component loads (empty array [] means "run once on mount")
  useEffect(() => {
    // onAuthStateChanged is a "listener" - it watches for login/logout changes
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser); // Update user state when auth changes
      setLoading(false);
    });
    
    // Cleanup function - unsubscribe when component unmounts
    return () => unsubscribe();
  }, []);

  // Google Sign-In function
  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // User state will automatically update via onAuthStateChanged above
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('Failed to sign in');
    }
  };

  // Sign-Out function
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  // ===== FETCH ITEMS FROM DATABASE =====
  // useEffect with [user] dependency means "run whenever user changes"
  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    try {
      // Query Firestore for all items, ordered by creation date (newest first)
      const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      // Map through documents and extract data + ID
      const itemsList = querySnapshot.docs.map(doc => ({
        id: doc.id, // Document ID needed for updates
        ...doc.data() // Spread operator gets all fields from document
      }));
      
      setItems(itemsList);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  // ===== ADD NEW ITEM =====
  const addItem = async (e) => {
    e.preventDefault(); // Prevent page reload
    
    if (!user) {
      alert('Please sign in to add items');
      return;
    }

    try {
      await addDoc(collection(db, 'items'), {
        name: itemName,
        owner: owner,
        address: address, // NEW: Save address
        available: true,
        borrowedBy: null, // Track who borrowed it
        createdAt: new Date(),
        createdByUserId: user.uid // Track who created it
      });
      
      alert('Item added!');
      // Clear form
      setItemName('');
      setOwner('');
      setAddress('');
      // Refresh the list
      fetchItems();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  // ===== BORROW ITEM =====
  const borrowItem = async (itemId) => {
    try {
      // doc(db, 'items', itemId) creates a reference to specific document
      const itemRef = doc(db, 'items', itemId);
      
      // updateDoc updates only the fields you specify
      await updateDoc(itemRef, {
        available: false,
        borrowedBy: user.displayName || user.email,
        borrowedAt: new Date()
      });
      
      fetchItems(); // Refresh list
    } catch (error) {
      console.error('Error borrowing item:', error);
      alert('Failed to borrow item');
    }
  };

  // ===== RETURN ITEM =====
  const returnItem = async (itemId) => {
    try {
      const itemRef = doc(db, 'items', itemId);
      await updateDoc(itemRef, {
        available: true,
        borrowedBy: null,
        borrowedAt: null
      });
      
      fetchItems();
    } catch (error) {
      console.error('Error returning item:', error);
      alert('Failed to return item');
    }
  };

  // ===== CONDITIONAL RENDERING =====
  // Show loading screen while checking auth status
  if (loading) {
    return <div className="App"><p>Loading...</p></div>;
  }

  // If not logged in, show sign-in screen
  if (!user) {
    return (
      <div className="App">
        <h1>Drag Library</h1>
        <p>Sign in to view and share items with friends!</p>
        <button onClick={handleSignIn}>Sign in with Google</button>
      </div>
    );
  }

  // ===== MAIN APP (LOGGED IN) =====
  return (
    <div className="App">
      <header>
        <h1>Drag Library</h1>
        <div className="user-info">
          <span>Welcome, {user.displayName || user.email}!</span>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      </header>

      {/* ADD ITEM FORM */}
      <section className="add-item-section">
        <h2>Add New Item</h2>
        <form onSubmit={addItem}>
          <input
            type="text"
            placeholder="Item name (e.g., Drill, Tent, Ladder)"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Owner name"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Address (only visible to signed-in users)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <button type="submit">Add Item</button>
        </form>
      </section>

      {/* ITEMS LIST */}
      <section className="items-section">
        <h2>Available Items</h2>
        
        {/* Conditional rendering: show message if no items */}
        {items.length === 0 ? (
          <p>No items yet. Add the first one!</p>
        ) : (
          <div className="items-grid">
            {/* .map() loops through array and creates JSX for each item */}
            {items.map((item) => (
              <div 
                key={item.id} 
                className={`item-card ${item.available ? 'available' : 'borrowed'}`}
              >
                <h3>{item.name}</h3>
                <p><strong>Owner:</strong> {item.owner}</p>
                <p><strong>Address:</strong> {item.address}</p>
                
                {/* Conditional rendering based on availability */}
                {item.available ? (
                  <>
                    <p className="status available-status">✓ Available</p>
                    <button 
                      onClick={() => borrowItem(item.id)}
                      className="borrow-btn"
                    >
                      Borrow This
                    </button>
                  </>
                ) : (
                  <>
                    <p className="status borrowed-status">
                      ✗ Borrowed by {item.borrowedBy}
                    </p>
                    {/* Only show return button if current user borrowed it */}
                    {item.borrowedBy === (user.displayName || user.email) && (
                      <button 
                        onClick={() => returnItem(item.id)}
                        className="return-btn"
                      >
                        Return Item
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;