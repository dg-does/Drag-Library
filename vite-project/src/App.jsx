import { useState } from 'react';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import './App.css';

function App() {
  const [itemName, setItemName] = useState('');
  const [owner, setOwner] = useState('');

  const addItem = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'items'), {
        name: itemName,
        owner: owner,
        available: true,
        createdAt: new Date()
      });
      alert('Item added!');
      setItemName('');
      setOwner('');
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  return (
    <div className="App">
      <h1>Drag Library</h1>
      <form onSubmit={addItem}>
        <input
          type="text"
          placeholder="Item name"
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
        <button type="submit">Add Item</button>
      </form>
    </div>
  );
}

export default App;