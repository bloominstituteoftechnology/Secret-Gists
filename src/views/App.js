import React, { Component } from 'react'
import { Grid, Col, Row, Jumbotron, ListGroup, ListGroupItem } from 'react-bootstrap'
import axios from 'axios'

import { NavBar } from './components/NavBar'

import './App.css'

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      posts: []
    }
    this.getGists = this.getGists.bind(this)
    this.createListItems = this.createListItems.bind(this)
  }

  async getGists() {
    const list = await axios.get('http://localhost:8000/gists')
    const posts = list.data.data.map(v => {
      return {
        id: v.id,
        filename: Object.values(v.files)[0].filename,
        description: v.description,
        username: v.owner.login,
        avatar: v.owner.avatar_url
      }
    })
    this.setState(prev => ({
      posts: [...prev.posts, ...posts]
    }))
  }

  createListItems(items) {
    return items.map((v, i) => (
      <ListGroupItem key={i} header={v.filename}>
        {v.description}
      </ListGroupItem>
    ))
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col lg={20}>
            <Jumbotron id="top">
              <h1>Secret Gists 🤐</h1>
            </Jumbotron>
            <NavBar getGists={this.getGists} />
          </Col>
        </Row>
        <Row>
          <Col lg={20}>
            <ListGroup>{this.createListItems(this.state.posts)}</ListGroup>
          </Col>
        </Row>
      </Grid>
    )
  }
}
