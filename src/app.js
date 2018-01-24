import React, { Component } from 'react';
import './App.css';
import axios from 'axios';
import { Button, Input, FormGroup, Label } from 'reactstrap';
import { AvForm, AvField, AvGroup, AvInput } from 'availity-reactstrap-validation';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.css';

const URL = 'http://localhost:3000';

class CreateGist extends Component {
  constructor(props) {
    super(props);
    this.state = {
      home: null,
      description: '',
      filename: '',
      boolean: true,
      content: '',
    }
  }

  componentDidMount() {
    axios
      .get(`${URL}/`)
        .then(res => {
          this.setState({ home: res.data });
        })
        .catch(err => {
          console.log(err);
        });
  }


  handleChangeContent(event) {
    this.setState({ content: event.target.value })
    event.preventDefault();
    console.log(this.state.content)
  }

  handleChangeDescription(event) {
    this.setState({ description: event.target.value })
    event.preventDefault();
    console.log(this.state.description)
  }

  handleChangeFilename(event) {
    this.setState({ filename: event.target.value })
    event.preventDefault();
    console.log(this.state.filename)
  }

  handleClickSecret(event) {
    let b = !this.state.boolean;
    this.setState({ boolean: b });
    console.log(this.state.boolean);
  }

  handleSubmit() {
    const url = this.state.boolean === true ? `${URL}/create` : `${URL}/createsecret`;
    const name = this.state.filename;
    const obj = {
      description: this.state.description,
      public: this.state.boolean,
      files: {
          [name]: {
            content: this.state.content,
        }
      },
      filename: name
    }
    
    axios
      .post(url,  obj )
        .then((res) => {
          console.log(res.data);
        })
        .catch((err) => {
          console.log(err)
        });

    this.setState({ filename: '', content: '', description: '' });
  }

  render() {
    return (
        <div className="CreateGist">
          <div className="Form1">
            <AvForm onSubmit={() => this.handleSubmit()}>
              <AvGroup>
                <Label check>
                  <AvInput type="checkbox" name="checkbox" onClick={(e) => this.handleClickSecret(e)}/> Encrypt
                </Label>
              </AvGroup>
                <AvField name="text" label="Description" style={{ width: 600 }} required value={this.state.description} onChange={(e) => this.handleChangeDescription(e)}/>
                <AvField name="file" label="Filename" style={{ width: 600 }} required  value={this.state.filename} onChange={(e) => this.handleChangeFilename(e)}/>
                <FormGroup>
                  <Label for="exampleText">Content</Label>
                  <Input type="textarea" name="text" id="exampleText" style={{height: 200, width: 600 }} value={this.state.content} onChange={(e) => this.handleChangeContent(e)}/>
                </FormGroup>
                <Button className="textButton" color="primary" >Submit</Button>
            </AvForm>
          </div>
        </div>
    );
  }
}


class DecryptGist extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: '',
      filename: '',
      text: null
    }
  }

  getGists(filename) {
    axios
      .get(`${URL}/gists`)
        .then((response) => {
          for (let obj of response.data.data) {
            if (Object.keys(obj.files)[0] === filename) {
              this.setState({ id: obj.id })
              return;
            }
          }
        })
        .catch((err) => {
          console.log(err);
        })
  }

  handleFilenameChange(event) {
    this.setState({ filename: event.target.value })
    event.preventDefault();
    console.log(this.state.filename)
  }

  handleSubmit() {
    console.log(this.state.filename)
    this.getGists(this.state.filename);
    console.log(this.state.id)
    axios
      .get(`${URL}/secretgist/${this.state.id}`)
        .then((response) => {
          this.setState({ text: response.data })
          console.log(response.data);
        })
        .catch((err) => {
          console.log(err);
        })
    this.setState({ filename: '' });
  }

  render() {
    let text = JSON.stringify(this.state.text) === JSON.stringify({}) ? null : this.state.text;
    console.log(text);
    return (
      <div className="DecryptGist">
        <div className="Form2">
          <AvForm onSubmit={() => this.handleSubmit()}>
            <AvField name="file" label="Filename" style={{ width: 600 }} required  value={this.state.filename} onChange={(e) => this.handleFilenameChange(e)}/>
            <h6>{text}</h6>
            <Button className="textButton" color="primary" >Submit</Button>
          </AvForm>
        </div>
      </div>
    )
  }

}

// class Login extends Component {

//   render() {
//     <div className="DecryptGist">
//       <div className="Form2">

//       </div>
//     </div>
//   }
// }

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      display: true
    }
  }
  
  render() {
    return (
      <Router >
        <div className="App">
          <header className="App-header">
            <ul>
              <li><Link to="/">Create Gist</Link></li>
              <li><Link to="/decrypt">Decrypt Gist</Link></li>
            </ul>
          </header>
          <Route exact path="/" component={CreateGist}/>
          <Route path="/decrypt" component={DecryptGist} />
          {/* <CreateGist /> */}
          {/* <DecryptGist /> */}
        </div>
      </Router >
    );
  }
}

export default App;
