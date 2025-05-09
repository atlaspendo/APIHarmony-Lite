Swagger Petstore OpenAPI Specification at https://petstore.swagger.io/v2/swagger.json

🧾 API Description
Name: Swagger Petstore API
 Spec URL: https://petstore.swagger.io/v2/swagger.json
 Format: OpenAPI 2.0 (Swagger)
 Base URL: https://petstore.swagger.io/v2
å
🎯 Purpose
The Swagger Petstore API is a sample web service designed to demonstrate the capabilities of the OpenAPI Specification (formerly known as Swagger). It provides a fictional online pet store with typical RESTful operations and is commonly used for:
Testing OpenAPI tools (e.g., Postman, Swagger UI)


Demonstrating API proxy generation (e.g., Apigee, Kong)


Learning and practicing REST API design and documentation



⚙️ Common Operations
Method
Endpoint
Description
GET
/pet/findByStatus
Retrieve pets by status (available, pending, sold)
GET
/pet/{petId}
Retrieve details of a single pet by ID
POST
/pet
Add a new pet to the store
PUT
/pet
Update an existing pet
DELETE
/pet/{petId}
Delete a pet
POST
/store/order
Place an order for a pet
GET
/store/order/{orderId}
Get order details by order ID
GET
/store/inventory
Get pet inventory by status
POST
/user
Create a user
GET
/user/{username}
Get user details by username
POST
/user/login
Logs in a user


🗂️ Key Data Structures
📦 Pet
json
CopyEdit
{
  "id": 0,
  "category": {
    "id": 0,
    "name": "string"
  },
  "name": "doggie",
  "photoUrls": ["string"],
  "tags": [
    {
      "id": 0,
      "name": "string"
    }
  ],
  "status": "available"
}

status values: "available", "pending", "sold"



🛒 Order
json
CopyEdit
{
  "id": 0,
  "petId": 0,
  "quantity": 0,
  "shipDate": "2023-10-09T00:00:00Z",
  "status": "placed",
  "complete": false
}


👤 User
json
CopyEdit
{
  "id": 0,
  "username": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "userStatus": 0
}

