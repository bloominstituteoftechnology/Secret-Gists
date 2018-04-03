import React, { Component } from 'react';
import axios from 'axios';

import './create-gist.css';

class CreateGist extends Component {
  constructor() {
    super();
    this.state = {
      name: '',
      content: '',
    };
  }

  handleNameChange = event => {
    this.setState({ name: event.target.value });
  };

  handleContentChange = event => {
    this.setState({ content: event.target.value });
  };

  handleSubmit = event => {
    event.preventDefault();

    axios.post('http://localhost:5000/create', {
      name: this.state.name,
      content: this.state.content,
    });
    this.setState({
      name: '',
      content: '',
    });
  };

  render() {
    return (
      <div className="container">
        <h1>Create a Gist</h1>
        <form onSubmit={this.handleSubmit}>
          <div>
            <label>
              Name:
              <input type="text" value={this.state.name} onChange={this.handleNameChange} />
            </label>
          </div>
          <div>
            <label>
              Content:
              <input
                className="content-box"
                type="text"
                value={this.state.content}
                onChange={this.handleContentChange}
              />
            </label>
          </div>
          <div>
            <input type="submit" value="submit" />
          </div>
        </form>
      </div>
    );
  }
}

export default CreateGist;
