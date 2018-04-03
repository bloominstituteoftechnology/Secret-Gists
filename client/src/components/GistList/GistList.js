import React, { Component } from 'react';
import axios from 'axios';

class GistList extends Component {
  constructor() {
    super();
    this.state = {
      gists: [],
    };
  }

  componentDidMount() {
    fetch('http://localhost:5000/gists')
      .then(results => results.json())
      .then(data => {
        this.setState({
          gists: data,
        });
        console.log(this.state.gists);
      });
  }

  render() {
    return (
      <div>
        <h1>The Gist List</h1>
      </div>
    );
  }
}

export default GistList;
