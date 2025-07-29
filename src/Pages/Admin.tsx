import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { Container } from '../Components/Container';

// import type { Schema } from '../../amplify/data/resource';
// import { generateClient } from '@aws-amplify/api';
// import { PrimaryButton } from '../Components/Buttons';

// import { Authenticator } from "@aws-amplify/ui-react";
// import "@aws-amplify/ui-react/styles.css";

// const client = generateClient<Schema>();

// async function sayHello() {
//     const result = await client.queries.sayHello({
//         name: 'Szilvi'
//     })
//     console.log(result);
// }

function Admin() {

    return (
        <Container>
            <Header />
            {/* <Authenticator>
                <PrimaryButton onClick={sayHello}>Say Hello</PrimaryButton>
            </Authenticator> */}
            <Footer />
        </Container>
    )
}

export default Admin;