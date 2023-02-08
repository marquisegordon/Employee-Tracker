const mysql = require('mysql2');
const inquirer = require('inquirer');
const cTable = require('console.table');
require('dotenv').config();

const db = mysql.createConnection(
    {
        host: '127.0.0.1',
        port: 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },
    console.log(`Connected to the employee_db database.`)
);

db.connect(function(err) {
    if (err) throw err
    console.log("Connected as Id" + db.threadId)
    startPrompt();
});

function startPrompt() {
    const startQuestion = [{
        type: 'list',
        name: 'choice',
        message: 'What would you like to do?',
        loop: false,
        choices: [
            'View all Employees',
            'Add Employee',
            'Update Employee Role',
            'View All Roles',
            'Add Role',
            'View All Departments',
            'Add Department'
        ],
    }]
    inquirer.prompt(startQuestion)
    .then(response => {
        switch (response.choice) {
            case 'View all Employees':
                viewAll("employee");
                break;

            case 'Add Employee':
                addEmployee();
                break;

            case 'Update Employee Role':
                updateRole();
                break;
            
            case 'View All Roles':
                viewAll("role");
                break;

            case 'Add Role':
                addRole();
                break;

            case 'View All Departments':
                viewAll("department");
                break;

            case 'Add Department':
                addDepartment();
                break;
            default:
                db.end();
        }
    })
    .catch (err => {
        console.error(err);
    });
};

const viewAll = (table) => {
    let query;
    if (table === "department") {
        query = `SELECT * FROM department`;
    } else if (table === "role") {
        query = `SELECT role.id, role.title, department.name AS department, role.salary
        FROM role
        JOIN department ON role.department_id = department.id;`;
    } else if (table === "employee") {
        query = `SELECT employee.id, employee.first_name, employee.last_name, role.title AS role, department.name AS department, CONCAT(M.first_name, " ", M.last_name) AS manager
        FROM employee 
        LEFT JOIN role ON employee.role_id = role.id
        LEFT JOIN department ON role.department_id = department.id
        LEFT JOIN employee AS M ON employee.manager_id = M.id;`;
    } else {
        console.log("Table does not exist.");
    }
    db.query(query, (err, res) => {
        if (err) throw err;
        console.table(res);
  
        startPrompt();
    });
};

function addEmployee() {
    db.query(`SELECT * FROM employee`, (err,res) => {
        if(err) throw err;
        const managerList = [{
            name: 'None',
            value: 0
        }];
        res.forEach(({ first_name, last_name, id }) => {
            let qRes = {
                name: first_name + ' ' + last_name,
                value: id
            }
            managerList.push(qRes);
        });

        db.query(`SELECT * FROM role`, (err, res) => {
            if (err) throw err;
            const roles = [];
            res.forEach(role => {
                let qRes = {
                    name: role.title,
                    value: role.id
                }
                roles.push(qRes);
            });
    
            let question = [
                {
                    type: 'input',
                    name: 'firstName',
                    message: `What is the employee's first name?`
                },
                {
                    type: 'input',
                    name: 'lastName',
                    message: `What is the employee's last name?`
                },
                {
                    type: 'list',
                    name: 'employeeRole',
                    message: `What is the employee's role?`,
                    choices: roles
                },
                {
                    type: 'list',
                    name: 'manager',
                    message: `Whos is the employee's manager?`,
                    choices: managerList
                }
            ];
    
            let query;
        
            inquirer.prompt(question)
            .then(response => {
                query = `INSERT INTO employee (first_name, last_name, role_id, manager_id)
                VALUES (?);`

                db.query(query, [[response.firstName, response.lastName, response.employeeRole, response.manager !== 0? response.manager: null]], (err, res) => {
                    if (err) throw err;
                    console.log(`Successfully added ${response.firstName} ${response.lastName} to employees`);
              
                    startPrompt();
                });
            });
        });
    });
};

function updateRole() {
    db.query(`SELECT * FROM employee`, (err,res) => {
        if(err) throw err;
        const employeeList = [];
        res.forEach(({ first_name, last_name, id }) => {
            let qRes = {
                name: first_name + ' ' + last_name,
                value: id
            }
            employeeList.push(qRes);
        });

        db.query(`SELECT * FROM role`, (err, res) => {
            if (err) throw err;
            const roles = [];
            res.forEach(role => {
                let qRes = {
                    name: role.title,
                    value: role.id
                }
                roles.push(qRes);
            });
    
            let question = [
                {
                    type: 'list',
                    name: 'employee',
                    message: `Which employee's role do you want to update?`,
                    choices: employeeList
                },
                {
                    type: 'list',
                    name: 'employeeRole',
                    message: 'What role would you like to assign the employee?',
                    choices: roles
                }
            ];
    
            let query;
        
            inquirer.prompt(question)
            .then(response => {
                query = `UPDATE employee
                SET ?
                WHERE ?? = ?;`

                db.query(query, [{role_id: response.role_id}, "id", response.id], (err, res) => {
                    if (err) throw err;
                    console.log(`Successfully updated role in the database. `);
              
                    startPrompt();
                });
            });
        });
    });
};

function addRole() {
    const departments = [];
    db.query(`SELECT * FROM department`, (err, res) => {
        if (err) throw err;
        res.forEach(department => {
            let qRes = {
                name: department.name,
                value: department.id
            }
            departments.push(qRes);
        });

        let question = [
            {
                type: 'input',
                name: 'roleName',
                message: 'What is the name of the role?'
            },
            {
                type: 'number',
                name: 'roleSalary',
                message: 'What is the salary of the role?'
            },
            {
                type: 'list',
                name: 'roleDepartment',
                message: 'Which department does the role belong to?',
                choices: departments
            }
        ];

        let query;
    
        inquirer.prompt(question)
        .then(response => {
            query = `INSERT INTO role (title, salary, department_id)
            VALUES (?);`
    
            db.query(query, [[response.roleName, response.roleSalary, response.roleDepartment]], (err, res) => {
                if (err) throw err;
                console.log(`Successfully added ${response.roleName} to roles`);
          
                startPrompt();
            });
        });
    });
};

function addDepartment() {
    let question = [{
        type: 'input',
        name: 'newDepartment',
        message: 'What is the name of the department?'
    }];

    let query;

    inquirer.prompt(question)
    .then(response => {
        query = `INSERT INTO department (name)
        VALUES (?);`

        db.query(query, [response.newDepartment], (err, res) => {
            if (err) throw err;
            console.log(`Successfully added ${response.newDepartment} to departments`);
      
            startPrompt();
        });
    });

};
