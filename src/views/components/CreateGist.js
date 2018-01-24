import React from 'react'
import { Button, Col, DropdownButton, FormControl, InputGroup, MenuItem, Row } from 'react-bootstrap'

export const CreateGist = props => {
  return (
    <div>
      <Row>
        <Col xs={3} xsOffset={1}>
          <InputGroup>
            <DropdownButton
            componentClass={InputGroup.Button}
            id="input-dropdown-addon"
            title="Encrypt"
            onSelect={props.handleEncrypt}
            value={props.encrypt}
            >
              <MenuItem eventKey={false}>Unencrypted</MenuItem>
              <MenuItem eventKey={true}>Encrypted</MenuItem>
            </DropdownButton>
            <FormControl
              id="bot"
              name="name"
              type="text"
              value={props.name}
              placeholder="Filename"
              onChange={props.handleChange}
            />
          </InputGroup>
        </Col>
        <Col xs={7}>
          <FormControl
            id="bot"
            name="desc"
            type="text"
            value={props.desc}
            placeholder="Description"
            onChange={props.handleChange}
          />
        </Col>
      </Row>
      <Row>
        <Col xs={10} xsOffset={1}>
          <FormControl
            id="gistcontent"
            name="content"
            type="text"
            componentClass="textarea"
            value={props.content}
            placeholder="Enter Gist"
            onChange={props.handleChange}
          />
        </Col>
      </Row>
      <Row>
        <Col xs={10} xsOffset={1} id="bot">
          <div className="btngroup">
            <Button onClick={props.submitGist} href="#" bsStyle="primary" id="top">
              Create Secret Gist
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  )
}
