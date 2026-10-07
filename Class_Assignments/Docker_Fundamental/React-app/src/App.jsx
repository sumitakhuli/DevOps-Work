import React, { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        padding: '60px',
      }}
    >
      <h1>Hello World from React</h1>
      <p>This React app was built with Vite and is served by Nginx inside a Docker container</p>
      <p>
        Name: Sumit Akhuli &nbsp;|&nbsp; Enrollment No: 24bcs10158
      </p>
      <button
        onClick={() => setCount((c) => c + 1)}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        Clicked {count} times
      </button>
      <p style={{ color: '#666', marginTop: '20px' }}>
        The button proves this is real React with working state, not a static page.
      </p>
    </div>
  )
}
