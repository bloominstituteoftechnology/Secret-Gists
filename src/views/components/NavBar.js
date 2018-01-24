import React from 'react'
import { Alert, Button, Col, ControlLabel, Form, FormControl, Row } from 'react-bootstrap'

export const NavBar = props => {
  const {
    handleChange,
    handleSubmit,
    dismissAlert,
    getGists,
    showCreate,
    username,
    token,
    logged_in,
    alert
  } = props

  return logged_in ? (
    <Row id="top">
      <Col xs={2} xsOffset={1}>
        <div className="btngroup">
        <Button onClick={getGists} href="#" bsStyle="success" id="btngist">
          Get Gists
        </Button>
        <Button onClick={showCreate} href="#">
          Create Gist
        </Button>
      </div>
      </Col>
      <Col xs={8}>
        <Alert id="alert" bsStyle="success" className={alert ? 'fade' : 'show'}>
          {dismissAlert()}
          <strong>Logged in!</strong> Ready to make some gists.
        </Alert>
      </Col>
    </Row>
  ) : (
    <Row id="top">
      <Col xs={10} xsOffset={1}>
        <Form inline>
          <Button bsStyle="info" disabled id="gistbtn">
            Get Gists
          </Button>{' '}
          <ControlLabel className="hidden-xs">Sign In</ControlLabel>{' '}
          <FormControl
            onChange={handleChange}
            name="username"
            value={username}
            type="text"
            placeholder="username"
          />{' '}
          <FormControl
            onChange={handleChange}
            name="token"
            value={token}
            type="text"
            placeholder="token"
          />{' '}
          <Button onClick={handleSubmit} type="submit">
            Send
          </Button>
        </Form>
      </Col>
    </Row>
  )
}
