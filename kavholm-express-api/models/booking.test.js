const { BadRequestError } = require("../utils/errors")
const Listing = require("./listing")
const Booking = require("./booking")
const app = require('../app')
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testListingIds,
} = require("../tests/common")
const request  = require("supertest")
const testTokens = require('../tests/createUsers')

beforeAll(commonBeforeAll)
beforeEach(commonBeforeEach)
afterEach(commonAfterEach)
afterAll(commonAfterAll)

describe("Booking", () => {
  describe("Test listBookingsFromUser", () => {
    test("Fetches all of the authenticated users' bookings", async () => {
      const user = { username: "jlo" }
      const listingId = testListingIds[0]
      const listing = await Listing.fetchListingById(listingId)

      const bookings = await Booking.listBookingsFromUser(user)
      expect(bookings.length).toEqual(2)

      const firstBooking = bookings[bookings.length - 1]

      firstBooking.totalCost = Number(firstBooking.totalCost)

      expect(firstBooking).toEqual({
        id: expect.any(Number),
        startDate: new Date("03-05-2021"),
        endDate: new Date("03-07-2021"),
        paymentMethod: "card",
        guests: 1,
        username: "jlo",
        hostUsername: "lebron",
        totalCost: Math.ceil(3 * (Number(listing.price) + Number(listing.price) * 0.1)),
        listingId: listingId,
        userId: expect.any(Number),
        createdAt: expect.any(Date),
      })
    })

    test("Returns empty array when user hasn't booked anything", async () => {
      const user = { username: "lebron" }

      const bookings = await Booking.listBookingsFromUser(user)
      expect(bookings).toHaveLength(0)
    })
  })

  describe("Test listBookingsForUserListings", () => {
    test("Fetches all of the bookings for any listing the user owns", async () => {
      const user = { username: "lebron" }
      const listingId = testListingIds[0]
      const listing = await Listing.fetchListingById(listingId)

      const bookings = await Booking.listBookingsForUserListings(user)
      expect(bookings.length).toEqual(2)

      const firstBooking = bookings[bookings.length - 1]

      firstBooking.totalCost = Number(firstBooking.totalCost)

      expect(firstBooking).toEqual({
        id: expect.any(Number),
        startDate: new Date("03-05-2021"),
        endDate: new Date("03-07-2021"),
        paymentMethod: "card",
        guests: 1,
        username: "jlo",
        hostUsername: "lebron",
        totalCost: Math.ceil(3 * (Number(listing.price) + Number(listing.price) * 0.1)),
        listingId: listingId,
        userId: expect.any(Number),
        createdAt: expect.any(Date),
      })
    })

    test("Returns empty array when users listing have no bookings", async () => {
      const user = { username: "serena" }

      const bookings = await Booking.listBookingsForUserListings(user)
      expect(bookings).toHaveLength(0)
    })
  })

  describe("Test createBooking",  () => {
    test("Can create a new booking with valid params", async() => { 
      const user = { username: "jlo" }
      const listingId = testListingIds[0]
      const listing = await Listing.fetchListingById(listingId)
      const newBooking = {
        startDate: new Date("03-05-2021"),
        endDate: new Date("03-07-2021"),
        guests : 45
        }
      const justBooked = await Booking.createBooking({newBooking, listing, user})
      expect(justBooked).toEqual({
        id: expect.any(Number),
        startDate: new Date("03-05-2021"),
        endDate: new Date("03-07-2021"),
        paymentMethod: "card",
        hostUsername: "lebron", 
        totalCost: "78623",
        listingId: listingId,
        guests: 45,
        username: "jlo",
        userId: expect.any(Number),
        createdAt: expect.any(Date),
      })
     })
    test("Throws error with invalid params", async () => {
      expect.assertions(1)
      const user = { username: "jlo" }
      const listingId = testListingIds[0]
      const listing = await Listing.fetchListingById(listingId)
      const newBooking = {
        endDate: "03-07-2021"
      }
      try{
        await Booking.createBooking({newBooking,listing,user})
      }
      catch(err){
        expect(err instanceof BadRequestError).toBeTruthy()
    }})
  })

  describe("POST bookings/listings/:listingId", () => {

    test("Authed user can book a listing they don't own.", async () => {
      const listingId = testListingIds[0]
      const data = { newBooking: 
          { 
            startDate: "03-05-2021", 
            endDate: "03-07-2021", 
            guests: 1 
          } 
        }
      const res = await request(app)
        .post(`/bookings/listings/${listingId}`)
        .set("authorization", `Bearer ${testTokens.jloToken}`)
        .send(data)
  
      expect(res.statusCode).toEqual(201)
  
      const { booking } = res.body
  
      booking.totalCost = Number(booking.totalCost)
  
      expect(booking).toEqual({
        id: expect.any(Number),
        startDate: new Date("03-05-2021").toISOString(),
        endDate: new Date("03-07-2021").toISOString(), 
        paymentMethod: "card",
        guests: 1,
        username: "jlo",
        hostUsername: "lebron",
        totalCost: expect.any(Number),
        listingId: listingId,
        userId: expect.any(Number),
        createdAt: expect.any(String), 
      })
    })
  
    test("Throws a Bad Request error when user attempts to book their own listing", async () => {
      const listingId = testListingIds[0]
      const data = { newBooking: 
          { 
            startDate: "03-05-2021", 
            endDate: "03-07-2021", 
            guests: 1 
          } 
        }
      const res = await request(app)
        .post(`/bookings/listings/${listingId}`)
        .set("authorization", `Bearer ${testTokens.lebronToken}`)
      .send(data)
  
      expect(res.statusCode).toEqual(400)
    })
  })
})
