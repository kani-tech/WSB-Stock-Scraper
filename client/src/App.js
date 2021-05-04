import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import React, { useState, useEffect } from 'react'
import Table from 'react-bootstrap/Table'



function App() {
  let interval = null

  const [stocks, setStocks] = useState([['Tsla', 4]])

  async function getStocks() {
    const response = await axios({
      url: 'http://localhost:5000/',
      method: 'post',
    })
    //console.log(response.data)
    setStocks(response.data)
  }

  const renderStocks = (ticker, index) => {
    return <tr key={index}>
      <td>{ticker.ticker}</td>
      <td>{ticker.count}</td>
    </tr>
  }

  console.log('stocks', stocks)
  useEffect(() => {
    getStocks();
    interval = setInterval(() => {
      getStocks();
    }, 60000);

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <div>
      <h1>Hello World</h1>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Occurences</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map(renderStocks)}
        </tbody>
      </Table>
    </div>

  )
}

export default App;
