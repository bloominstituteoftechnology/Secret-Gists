import React, { Component } from 'react'
import { Col, Grid, Jumbotron, ListGroup, ListGroupItem, Row } from 'react-bootstrap'
import axios from 'axios'

import { NavBar } from './components/NavBar'
import { CreateGist } from './components/CreateGist'

import './App.css'

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      posts: [],
      name: '',
      desc: '',
      content: '',
      username: '',
      token: '',
      create: false,
      logged_in: false,
      alert: false,
      encrypt: false
    }
    this.getGists = this.getGists.bind(this)
    this.createListItems = this.createListItems.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.showCreate = this.showCreate.bind(this)
    this.dismissAlert = this.dismissAlert.bind(this)
    this.submitGist = this.submitGist.bind(this)
    this.handleEncrypt = this.handleEncrypt.bind(this)
  }

  async getGists() {
    const list = await axios.get('http://localhost:8000/gists')
    const posts = list.data.data.map(v => {
      return {
        id: v.id,
        name: Object.values(v.files)[0].filename,
        desc: v.description,
        username: v.owner.login,
        avatar: v.owner.avatar_url
      }
    })
    this.setState({ posts: [...posts] })
  }

  showCreate() {
    this.setState(prev => ({ create: !prev.create }))
  }

  createListItems(items) {
    return items.map((v, i) => (
      <ListGroupItem key={i} header={v.name}>
        {v.desc}
      </ListGroupItem>
    ))
  }

  dismissAlert() {
    setTimeout(() => {
      this.setState({ alert: true })
    }, 2000)
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

  handleEncrypt(e) {
    this.setState({ encrypt: e })
  }

  async submitGist(e) {
    e.preventDefault()
    const { name, content, desc, encrypt } = this.state
    try {
      let response
      encrypt
        ? response = await axios.post('http://localhost:8000/createsecret', { name, content, desc })
        : response = await axios.post('http://localhost:8000/create', { name, content, desc })
      response.status === 200 ? this.showCreate() : console.log(response.statusText)
    } catch (e) {
      console.log(e)
    }
  }

  render() {
    const { create, name, desc, content, username, token, logged_in, alert, encrypt } = this.state
    const navProps = {
      username, token, logged_in, alert,
      handleChange: this.handleChange,
      handleSubmit: this.handleSubmit,
      getGists: this.getGists,
      showCreate: this.showCreate,
      dismissAlert: this.dismissAlert
    }
    const createProps = {
      name, desc, content, encrypt,
      handleChange: this.handleChange,
      handleEncrypt: this.handleEncrypt,
      submitGist: this.submitGist
    }

    return (
      <Grid>
        <NavBar {...navProps} />
        <Row>
          <Col xs={10} xsOffset={1}>
            <Jumbotron id="jumbo">
              <h1>Secret Gists 🤐</h1>
            </Jumbotron>
          </Col>
        </Row>
        {create && <CreateGist {...createProps} />}
        <Row>
          <Col xs={10} xsOffset={1} id="top">
            <ListGroup>{this.createListItems(this.state.posts)}</ListGroup>
          </Col>
        </Row>
      </Grid>
    )
  }
}
