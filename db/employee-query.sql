SELECT employee.id, employee.first_name, employee.last_name, role.title AS role, department.name AS department, CONCAT(M.first_name, " ", M.last_name) AS manager
FROM employee 
LEFT JOIN role ON employee.role_id = role.id
LEFT JOIN department ON role.department_id = department.id
LEFT JOIN employee AS M ON employee.manager_id = M.id;