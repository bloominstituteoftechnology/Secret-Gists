import React, { Component } from 'react'
import { Grid, Col, Row, Jumbotron, ListGroup, ListGroupItem } from 'react-bootstrap'
import axios from 'axios'

import { NavBar } from './components/NavBar'

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      posts: []
    }
    this.getGists = this.getGists.bind(this)
    this.getGist = this.getGists.bind(this)
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

  async getGist(id) {
    const post = await axios.get(`http://localhost:8000/secretgist/${id}`)
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
            <NavBar getGists={this.getGists} />
            <Jumbotron>
              <h1>Welcome 👋</h1>
            </Jumbotron>
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
