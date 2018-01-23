import React from 'react'
import { Nav, Navbar, NavItem } from 'react-bootstrap'

export const NavBar = props => {
  const x = () => props.getGists()

  return (
    <Navbar>
      <Navbar.Header>
        <Navbar.Brand>
          <a href="#home">Secret Gists!</a>
        </Navbar.Brand>
      </Navbar.Header>
      <Nav>
        <NavItem onClick={() => x()} href="#">
          Get Gists
        </NavItem>
        <NavItem href="#">Sign In</NavItem>
      </Nav>
    </Navbar>
  )
}
