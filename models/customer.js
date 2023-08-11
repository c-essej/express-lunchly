"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** search for customers */

  static async search(query) {
    let results;

    const nameSplit = query.split(" ");

    if (nameSplit.length === 1) {
      let text = `%${query}%`;

      results = await db.query(
        `SELECT id,
                first_name AS "firstName",
                last_name  AS "lastName",
                phone,
                notes
          FROM customers
          WHERE customers.first_name ILIKE $1
          OR customers.last_name ILIKE $1`,
        [text]);
    } else if (nameSplit.length === 2) {
      let firstName = `%${nameSplit[0]}%`;
      let lastName = `%${nameSplit[1]}%`;

      results = await db.query(
        `SELECT id,
                first_name AS "firstName",
                last_name  AS "lastName",
                phone,
                notes
          FROM customers
          WHERE customers.first_name ILIKE $1
          AND customers.last_name ILIKE $2`,
        [firstName, lastName]);
    }

    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }


  /** get top ten customers. */

  static async getTopTen() {
    console.log('we got here');
    const results = await db.query(
      `SELECT c.id,
          c.first_name AS "firstName",
          c.last_name  AS "lastName",
          c.phone,
          c.notes,
          COUNT(*)
        FROM customers as c
        JOIN reservations as r
        ON c.id = r.customer_id
        GROUP BY c.id
        ORDER BY COUNT(*) DESC
        LIMIT 10`,
    );
    console.log('the result is=', results);
    return results.rows.map(c => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** returns first and last name of customer */

  fullName() {
    return this.firstName + ' ' + this.lastName;
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }
}



module.exports = Customer;
