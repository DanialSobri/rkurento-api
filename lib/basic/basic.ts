// Example of async module

// Fetch all users => /employee
// Wait for all user data. Extract the id from each user. Fetch each user => /employee/{id}
// Generate email for each user from their username

const baseApi = 'https://reqres.in/api/users?page=1'
const userApi = 'https://reqres.in/api/user'

// Example API Schema
interface Employee {
    id: number
    employee_name: string
    employee_salary: number
    employee_age: number
    profile_image: string
}

/**
 * @param  {string} url
 */
const fetchAllEmployees = async (url: string): Promise<Employee[]> => {
    const response = await fetch(url)
    const { data } = await response.json()
    return data
}

/**
 * @param  {string} url
 * @param  {number} id
 */
const fetchEmployee = async (url: string, id: number): Promise<Record<string, string>> => {
    const response = await fetch(`${url}/${id}`)
    const { data } = await response.json()
    return data
}

/**
 * @param  {string} name
 */
const generateEmail = (name: string): string => {
    return `${name.split(' ').join('.')}@company.com`
}

const runAsyncFunctions = async () => {
    try {
        const employees = await fetchAllEmployees(baseApi)
        Promise.all(
            employees.map(async user => {
                const userName = await fetchEmployee(userApi, user.id)
                const emails = generateEmail(userName.name)
                return emails
            })
        )
    } catch (error) {
        console.log(error)
    }
}
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
