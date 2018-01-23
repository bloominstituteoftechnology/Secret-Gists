import React, { Component } from 'react'
import {
  Alert,
  Button,
  ControlLabel,
  Form,
  FormControl,
  FormGroup
} from 'react-bootstrap'
import axios from 'axios'

export class NavBar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      username: '',
      token: '',
      logged_in: false,
      alert: false
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange(e) {
    const { name, value } = e.target
    this.setState({ [name]: value })
  }

  async handleSubmit(e) {
    e.preventDefault()
    const { username, token } = this.state
    try {
      await axios.post('http://localhost:8000/login', { username, token })
      this.setState({ logged_in: true })
    } catch (e) {
      console.log(e)
    }
  }

  dismissAlert() {
    setTimeout(() => {
      this.setState({ alert: true })
    }, 2000)
  }

  render() {
    const x = () => this.props.getGists()
    const { username, token, logged_in, alert } = this.state

    return logged_in ? (
      <div>
        <Form inline className="nav_form">
          <Button onClick={() => x()} href="#" bsStyle="success">
            Get Gists
          </Button>
        </Form>
        <Alert bsStyle="success" className={alert ? 'fade' : 'show'}>
          {this.dismissAlert()}
          <strong>Logged in!</strong> Ready to make some gists.
        </Alert>
      </div>
    ) : (
      <Form inline className="nav_form">
        <Button bsStyle="info" disabled>
          Get Gists
        </Button>
        <FormGroup controlId="formInlineName">
          <ControlLabel>Username</ControlLabel>{' '}
          <FormControl
            onChange={this.handleChange}
            name="username"
            value={username}
            type="text"
            placeholder="username"
          />
        </FormGroup>{' '}
        <FormGroup controlId="formInlineEmail">
          <ControlLabel>OAuth Token</ControlLabel>{' '}
          <FormControl
            onChange={this.handleChange}
            name="token"
            value={token}
            type="text"
            placeholder="token"
          />
        </FormGroup>{' '}
        <Button onClick={this.handleSubmit} type="submit">
          Send
        </Button>
      </Form>
    )
  }
}
