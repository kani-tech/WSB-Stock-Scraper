import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import React, { useState, useEffect } from 'react'
import Table from 'react-bootstrap/Table'



function App() {

  const [stocks, setStocks] = useState()

  async function getStocks() {
    const response = await axios({
      url: 'http://localhost:5000/',
      method: 'get',
    })
    stocks.push(response)
  }

  const renderStocks = (ticker, index) => {
    return <tr key={index}>
      <td>{ticker.name}</td>
      <td>{ticker.count}</td>
    </tr>
  }
  return (
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
  )
}

export default App;
