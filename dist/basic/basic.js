"use strict";
// Example of async module
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Fetch all users => /employee
// Wait for all user data. Extract the id from each user. Fetch each user => /employee/{id}
// Generate email for each user from their username
const baseApi = 'https://reqres.in/api/users?page=1';
const userApi = 'https://reqres.in/api/user';
/**
 * @param  {string} url
 */
const fetchAllEmployees = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(url);
    const { data } = yield response.json();
    return data;
});
/**
 * @param  {string} url
 * @param  {number} id
 */
const fetchEmployee = (url, id) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(`${url}/${id}`);
    const { data } = yield response.json();
    return data;
});
/**
 * @param  {string} name
 */
const generateEmail = (name) => {
    return `${name.split(' ').join('.')}@company.com`;
};
const runAsyncFunctions = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employees = yield fetchAllEmployees(baseApi);
        Promise.all(employees.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            const userName = yield fetchEmployee(userApi, user.id);
            const emails = generateEmail(userName.name);
            return emails;
        })));
    }
    catch (error) {
        console.log(error);
    }
});
// runAsyncFunctions()
// var bookId = req.params.id;
//     //read the data part 
//     Book.findOne({ _id: bookId }, (err, oneBook) => {
//         if (err) console.error(err);
//         //pass data to the template engine
//         res.render('book/sale', { oneBook });
//     });
//        // Or you can use findById()
//     Book.findById({ bookId }, (err, oneBook) => {
//         if (err) console.error(err);
//         //pass data to the template engine
//         res.render('book/sale', { oneBook });
//     });
// callerCandidatesCollection.add(event.candidate.toJSON());
