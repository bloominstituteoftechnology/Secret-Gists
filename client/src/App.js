import React, { Component } from 'react';

import './App.css';

import CreateGist from './components/CreateGist/CreateGist';
import GistList from './components/GistList/GistList';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Welcome to Gist Secret Code Base</h1>
        </header>
        <CreateGist />
        <GistList />
      </div>
    );
  }
}

export default App;
