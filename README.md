## loopback-connector-firebase

Firebase admin connector for loopback

Documentation: TBD


## Customizing Firebase admin configuration for tests/examples

The .loopbackrc file is in JSON format, for example:

    "teste": {
        "name": "teste",
        "connector": "loopback-connector-zater-firebase-admin",
        "serviceAccount": {
            "type": "service_account",
            "project_id": "project_id",
            "private_key_id": "private_key_id",
            "private_key": "private_key",
            "client_email": "client_email",
            "client_id": "client_id",
            "auth_uri": "auth_uri",
            "token_uri": "token_uri",
            "auth_provider_x509_cert_url": "auth_provider_x509_cert_url",
            "client_x509_cert_url": "client_x509_cert_url"
        },
        "databaseURL": "databaseURL",
        "databaseAuthVariableOverride": "admin" // optional
    }

## Running databaseAuthVariableOverride firebase roles

    "mymodels": {
        ".read": "auth.uid === 'admin' ",
        ".write": "auth.uid === 'admin' "
    }

## Running tests

 * npm test - To run the test
 * npm run coverage - To find the code coverage

## Release notes
 Yet to be Released officially
