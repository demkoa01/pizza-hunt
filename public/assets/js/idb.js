//create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'pizza_hunt' and set to version 1
const request = indexedDB.open('pizza_hunt', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to db
    const db = event.target.result;
    //create an object store (table) called 'new_pizza' and set to have autoincrement
    db.createObjectStore('new_pizza', { autoIncrement: true });
};

// successful
request.onsuccess = function(event) {
    // when db is successfully created with object store
    db = event.target.result;

    //check if app is online
    if (navigator.onLine) {
        uploadPizza();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    //open a new transaction with database with read/write permission
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    //access the object store for 'new_pizza'
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // add record to your store with add method
    pizzaObjectStore.add(record);
}

function uploadPizza() {
    //open transaction on your db
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    //access object store
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    //get all records from store and set to variable
    const getAll = pizzaObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
          fetch('/api/pizzas', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          })
            .then(response => response.json())
            .then(serverResponse => {
              if (serverResponse.message) {
                throw new Error(serverResponse);
              }
              // open one more transaction
              const transaction = db.transaction(['new_pizza'], 'readwrite');
              // access the new_pizza object store
              const pizzaObjectStore = transaction.objectStore('new_pizza');
              // clear all items in your store
              pizzaObjectStore.clear();
    
              alert('All saved pizza has been submitted!');
            })
            .catch(err => {
              console.log(err);
            });
        }
    };
}

//listen for app coming back online
window.addEventListener('online', uploadPizza);