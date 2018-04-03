import React from 'react';

export default (props) => {
    return(
        <body>
            
            <h1>List of service's</h1>
            <ul>
                <li>
                    <h3><span>/</span> This page.</h3>
                </li>
                <li>
                    <h3><span>/gists</span> A list of gists.</h3>
                </li>
                <li>
                    <h3><span>/key</span> The key.</h3>
                </li>
                <li>
                    <h3><span>/secretgist/:id</span> Keeping Secrets.</h3>                    
                </li>
                <li>
                    <h3><span>/create</span> Create something new!</h3>                    
                </li>
                <li>
                    <h3><span>/createsecret</span> Create something secret.</h3>
                </li>
                <li>
                    <h3><span>/login</span> Login in to gain access to your stuff.</h3>        
                </li>
            </ul>
        </body>
    );
}