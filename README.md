# mongoose-smart-api
## Description
### main features
- No code: is a library that allows you to create a RESTful API without any coding.
- Simple Configuration: you can create a RESTful API with a simple configuration in one yaml file.
- Security: you can secure your ressources with a simple configuration.
- For each ressource, you have the next operations available:
    - **creating**:
        - create: create a new one document
        - createMany: create many documents with one request
        - import: create many documents from a file
    - **reading**:
        - getById: find a document by id
        - getByIds: find many documents by ids
        - getByQuery: find many documents by query
        - getAll: find all documents
        - export: for getByIds, getByQuery and getAll, you can export the result to a file
    - **updating**:
        - updateById: update a document by id
        - updateByIds: update many documents by ids
        - updateByQuery: update many documents by query
        - updateAll: update all documents
    - **deleting**:
        - deleteById: delete a document by id
        - deleteByIds: delete many documents by ids
        - deleteByQuery: delete many documents by query
        - deleteAll: delete all documents
## Usage
### Installation
```bash
npm install @smart-api/mongoose
```
### use in index.js
```javascript
const getSmartApi = require('@smart-api/mongoose');
const express = require('express');

const myApi = getSmartApi({
    configPath: 'path/to/configDir',
    apiName: 'my-api',
})

myApi.listen(3000, () => {
    console.log('Server is running on port 3000');
});

```
### Configuration: configDir/smart-api.yaml
in the configDir, you should create a smart-api.yaml file with the next structure:
    - ressourceX: main key is the name of the ressource, and should have the schema and the permissions.
        - the schema contains the next keys:
            - timestamps: if true, the library will add createdAt and updatedAt fields and manage them.
            - fields: the fields of the ressource can have simple mongoose configuration.
        - the permissions follow the next structure:
            - default: the default permissions for all actions and for all users roles.
            - actionX: the permissions for the actionX;
                - default: the default permissions for the actionX and for all users roles.
                - roleX: the permissions for the actionX and for the roleX. override the default permissions for the actionX and for the ressourceX
the permissions controles are:
    - enabled: if false the action is disabled.
    - userFilter: it's used on the current user to check if the user can access the action.
    - queryFilter: it's used while fetching data. help as pre-filtering the data.
    - fieldsPopulate: it's used while fetching data. help as pre-populating the fields. for related ressources.
    - ressourceFilter: it's used on the fetched documents to check if the user can access them.
    - fieldsFilter: it's used on the fetched documents to filter the fields that the user can update/read.

Example:
```yaml
users:
    schema:
        timestamps: true
        fields:
            fullname:
                type: String
            username:
                type: String
                required: true
            role:
                type: String
                required: true
                enum: "'user', 'admin'"
                default: 'user'
            password:
                type: String
                required: true
    permissions:
        default:
            enabled: true

comments:
    schema:
        timestamps: true
        fields:
            content:
                type: String
                required: true
            author:
                type: objectid
                required: true
                ref: users
            post:
                type: objectid
                required: true
                ref: posts
    permissions:
        default:
            enabled: true
            fieldsPopulate:
                - path: author
                  select: fullname
                - path: post
                  select: title

posts:
    schema:
        timestamps: true
        fields:
            title:
                type: String
                required: true
            content:
                type: String
                required: true
            author:
                type: objectid
                required: true
                ref: users
                fromUser: _id
    permissions:
        default:
            enabled: true
            userFilter:
                - field: isActive
                  value: true
                - field: role
                  value: us
                  operator: regex
            fieldsPopulate:
                - path: author
                  select: fullname
            ressourceFilter:
                - field: author.fullname
                  value: smapiuser@fullname
                  operator: regex
            fieldsFilter:
                denied:
                    - author
        updateById:
            default:
                fieldsFilter:
                    denied:
                        - title
```