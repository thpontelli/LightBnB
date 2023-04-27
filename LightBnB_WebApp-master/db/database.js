const properties = require("./json/properties.json");
const users = require("./json/users.json");

/// Users

const { Pool } = require('pg');

const pool = new Pool({
  user: 'thiagopontelli',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});



/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
  .query (`SELECT name, email, password, id FROM users
    WHERE email = $1;`,
    [email])
  
    .then((result) => {
      console.log(result);
      if (result.rowCount === 0) {
        return null
      } else {
        return result.rows[0]
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
  // let resolvedUser = null;
  // for (const userId in users) {
  //   const user = users[userId];
  //   if (user?.email.toLowerCase() === email?.toLowerCase()) {
  //     resolvedUser = user;
  //   }
  // }
  //return Promise.resolve(resolvedUser);
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
  .query (`SELECT name, email, password, id FROM users
    WHERE id = $1;`,
    [id])
  
    .then((result) => {
      console.log(result);
      if (result.rowCount === 0) {
        return null
      } else {
        return result.rows[0]
      }
    })
    .catch((err) => {
      console.log(err.message);
    });

  //return Promise.resolve(users[id]);
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
  .query (`INSERT INTO users (name, email, password) 
  VALUES ($1, $2, $3)
  RETURNING *;`,
    [user.name, user.email, user.password])
  
    .then((result) => {
      console.log(result.rows);
      user.id = result.rows[0].id;
      if (result.rowCount === 0) {
        return null
      } else {
        return result.rows[0]
      }
    })
    .catch((err) => {
      console.log(err.message);
    });

  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
  .query(
    `SELECT 
    reservations.*, 
    properties.*, 
    AVG(property_reviews.rating)
  FROM properties
  JOIN reservations ON reservations.property_id = properties.id
  JOIN property_reviews ON property_reviews.property_id = properties.id
  WHERE reservations.guest_id = $1
  GROUP BY reservations.id, properties.title, properties.cost_per_night, properties.id
  ORDER BY start_date ASC
  LIMIT $2;`,
  [guest_id, limit]
  )
  .then((result) => {
    console.log(result.rows);
    return result.rows
  })
  .catch((err) => {
    console.log(err.message);
  });
  
  //return getAllProperties(null, 2);
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE properties.city LIKE $${queryParams.length} 
    `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night}`);
    queryString += `AND properties.cost_per_night > $${queryParams.length} * 100 
    `;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night}`);
    queryString += `AND properties.cost_per_night < $${queryParams.length} * 100 
    `; 
  } 
  
  
  // 4
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `GROUP BY properties.id
    HAVING avg(property_reviews.rating) >= $${queryParams.length} 
    ORDER BY cost_per_night
    `

    queryParams.push(limit);
    queryString += `LIMIT $${queryParams.length};
    `;
  } else {
    queryParams.push(limit);
    queryString += `GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;  
  }

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
  
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
