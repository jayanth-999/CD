import { useState, useEffect } from 'react'

function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])

  useEffect(() => {
    // In a real app, fetch from backend
    // fetch('http://localhost:3000/products').then(...)
    setProducts([
      { id: 1, name: 'Laptop', price: 999 },
      { id: 2, name: 'Phone', price: 499 },
      { id: 3, name: 'Headphones', price: 99 }
    ])
  }, [])

  const addToCart = (product) => {
    setCart([...cart, product])
    // In a real app, send order to backend (which sends to Kafka)
    console.log('Added to cart:', product)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">E-Cart DevOps Demo</h1>
        <p className="text-gray-600">Learning K8s, Helm, and Kafka</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className="flex justify-between items-center border-b pb-2">
                <span>{product.name} - ${product.price}</span>
                <button
                  onClick={() => addToCart(product)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Cart ({cart.length})</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500">Your cart is empty</p>
          ) : (
            <ul className="space-y-2">
              {cart.map((item, index) => (
                <li key={index} className="text-gray-700">{item.name} - ${item.price}</li>
              ))}
            </ul>
          )}
          {cart.length > 0 && (
            <button
              className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              onClick={() => alert('Checkout feature coming soon (will trigger Kafka)')}
            >
              Checkout
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
