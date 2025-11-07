export const stories = [
  {
    id: "story-01",
    slug: "registration-university-email",
    epic: "Registration & Authentication",
    title: "Registration with University Email",
    description:
      "As a student, I want to register with my institutional email so that I can access the Wheels platform.",
    acceptanceCriteria: [
      "Form accepts first name, last name, university ID, phone and email.",
      "Email must end with @unisabana.edu.co.",
      "User saved in DB and password stored hashed."
    ],
    checklist: [
      "Design registration screen in Figma.",
      "Implement front-end form and client-side validation.",
      "Implement backend endpoint POST /auth/register.",
      "Validate email domain on backend.",
      "Hash password (bcrypt/argon2) and save user in MongoDB.",
      "Add success flow → redirect to login and send welcome email.",
      "Add unit tests for backend validation."
    ],
    labels: ["Epic: Registration", "Frontend", "Backend"],
    priority: "High",
    apiContract: {
      endpoint: "/auth/register",
      method: "POST",
      sideNote:
        "Registers a new user with institutional email validation (@unisabana.edu.co). Passwords must be hashed and non-institutional domains rejected."
    }
  },
  {
    id: "story-02",
    slug: "login-with-credentials",
    epic: "Registration & Authentication",
    title: "Login with Credentials",
    description:
      "As a registered user, I want to log in with my email and password so that I can access my account.",
    acceptanceCriteria: [
      "Login accepts email + password and returns auth token.",
      "Invalid credentials show friendly error."
    ],
    checklist: [
      "Design login screen in Figma.",
      "Implement login form (frontend).",
      "Implement backend POST /auth/login (issue JWT or session).",
      "Add middleware to protect endpoints.",
      "Add unit/integration tests."
    ],
    labels: ["Epic: Registration", "Frontend", "Backend"],
    priority: "High",
    apiContract: {
      endpoint: "/auth/login",
      method: "POST",
      sideNote: "Authenticates the user and returns a JWT token. Provide clear error messages for invalid credentials."
    }
  },
  {
    id: "story-03",
    slug: "logout-flow",
    epic: "Registration & Authentication",
    title: "Logout",
    description: "As a user, I want to log out so that I can protect my account on shared devices.",
    acceptanceCriteria: [
      "Logout clears client token/session.",
      "Server invalidates refresh tokens if applicable."
    ],
    checklist: [
      "Add logout button in UI.",
      "Implement client-side token removal.",
      "Backend: invalidate refresh token endpoint if using refresh tokens.",
      "UI redirect to login after logout."
    ],
    labels: ["Epic: Registration", "Frontend", "Backend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/auth/logout",
      method: "POST",
      sideNote: "Invalidates the current token or session. If refresh tokens are used, revoke them on the server."
    }
  },
  {
    id: "story-04",
    slug: "password-recovery",
    epic: "Registration & Authentication",
    title: "Password Recovery",
    description: "As a user, I want to recover my password so that I can regain access if I forget it.",
    acceptanceCriteria: [
      "Recovery request sends single-use link to university email.",
      "Link expires after a short time."
    ],
    checklist: [
      "Design password recovery screens (request & reset) in Figma.",
      "Implement POST /auth/forgot-password to send tokenized email.",
      "Implement POST /auth/reset-password to set new password.",
      "Secure tokens and expiration in DB.",
      "Email templates and test flows."
    ],
    labels: ["Epic: Registration", "Frontend", "Backend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/auth/forgot-password, /auth/reset-password",
      method: "POST",
      sideNote:
        "/forgot-password sends a reset link/token to the institutional email; /reset-password verifies and updates the password. Tokens must be single-use and expire shortly."
    }
  },
  {
    id: "story-05",
    slug: "profile-view-edit",
    epic: "Registration & Authentication",
    title: "View & Edit Profile",
    description: "As a user, I want to view and edit my profile so that I can keep my information up to date.",
    acceptanceCriteria: [
      "User can view profile fields and update permitted fields.",
      "Changes persist in DB."
    ],
    checklist: [
      "Design profile screen in Figma (view & edit states).",
      "Implement frontend profile page and edit form.",
      "Implement backend GET /users/me and PUT /users/me.",
      "Validate inputs and save to DB.",
      "Add profile photo upload handling (storage)."
    ],
    labels: ["Epic: Registration", "Frontend", "Backend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "/users/me",
      method: "GET / PUT",
      sideNote: "Allows users to view and update their data (excluding institutional email). Validate all inputs and persist changes securely."
    }
  },
  {
    id: "story-06",
    slug: "validate-institutional-email",
    epic: "Registration & Authentication",
    title: "Validate Institutional Email (System Rule)",
    description:
      "As a system, only allow registrations with @unisabana.edu.co to ensure authentic users.",
    acceptanceCriteria: [
      "No account created for other domains.",
      "Error explains requirement to user."
    ],
    checklist: [
      "Add server-side email domain validation.",
      "Add client-side hint to registration form.",
      "Write tests for domain validation."
    ],
    labels: ["Epic: Registration", "Backend"],
    priority: "High",
    apiContract: {
      endpoint: "/auth/register",
      method: "POST",
      sideNote: "Backend rule that ensures only @unisabana.edu.co emails are accepted during registration."
    }
  },
  {
    id: "story-07",
    slug: "register-vehicle",
    epic: "Vehicles & Driver Management",
    title: "Register Vehicle",
    description:
      "As a passenger, I want to register a vehicle (plate, brand, model, capacity, SOAT, license) so that I can become a driver.",
    acceptanceCriteria: [
      "Form accepts vehicle details and links vehicles to user.",
      "Mandatory documents upload fields present."
    ],
    checklist: [
      "Design vehicle registration form in Figma.",
      "Implement frontend vehicle form and file uploads.",
      "Implement backend POST /vehicles and DB model.",
      "Store files (SOAT, license) securely in storage (e.g., S3).",
      "Validate mandatory fields and return success."
    ],
    labels: ["Epic: Vehicles", "Frontend", "Backend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "/vehicles",
      method: "POST",
      sideNote: "Registers a driver’s vehicle with required fields (plate, brand, capacity, SOAT, license). Validate formats and store files securely."
    }
  },
  {
    id: "story-08",
    slug: "switch-passenger-driver",
    epic: "Vehicles & Driver Management",
    title: "Switch between Passenger and Driver Roles",
    description: "As a user, I want to switch between passenger and driver so that I can use both modes.",
    acceptanceCriteria: [
      "Toggle in profile to switch mode.",
      "If no vehicle, switch to driver is disabled with explanation."
    ],
    checklist: [
      "Design role toggle UI in Figma.",
      "Implement toggle on frontend and role state.",
      "Backend: update user role and guard driver-only routes.",
      "Add validation: block switch if no vehicle or invalid docs."
    ],
    labels: ["Epic: Vehicles", "Frontend", "Backend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/users/role",
      method: "PUT",
      sideNote: "Updates the user’s active role. Prevent switching to driver if no valid vehicle or expired documents."
    }
  },
  {
    id: "story-09",
    slug: "manage-multiple-vehicles",
    epic: "Vehicles & Driver Management",
    title: "Manage Multiple Vehicles",
    description: "As a driver, I want to add, edit or delete vehicles so that I can keep my fleet up to date.",
    acceptanceCriteria: [
      "User can add more than one vehicle and set an active vehicle for a trip."
    ],
    checklist: [
      "UI for list of vehicles, add/edit/delete in Figma.",
      "Implement CRUD endpoints /vehicles (GET/POST/PUT/DELETE).",
      "Implement frontend flows to select active vehicle for trips.",
      "Tests for data integrity on delete (no orphaned trips)."
    ],
    labels: ["Epic: Vehicles", "Frontend", "Backend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/vehicles",
      method: "GET / POST / PUT / DELETE",
      sideNote: "Full CRUD for managing multiple vehicles per user. Prevent deletion if a vehicle is linked to active trips."
    }
  },
  {
    id: "story-10",
    slug: "validate-vehicle-data",
    epic: "Vehicles & Driver Management",
    title: "Validate Vehicle Data",
    description: "As a system, validate vehicle fields (capacity, plate format) before allowing trips.",
    acceptanceCriteria: [
      "Capacity must be > 0 and ≤ reasonable max.",
      "Plate format validated per local rules."
    ],
    checklist: [
      "Implement backend validators for vehicle models.",
      "Add client-side validation messages.",
      "Unit tests for validators."
    ],
    labels: ["Epic: Vehicles", "Backend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/vehicles/validate",
      method: "POST",
      sideNote: "Validates capacity, plate format, and logical limits before allowing the vehicle to be used in trips."
    }
  },
  {
    id: "story-11",
    slug: "validate-documents",
    epic: "Vehicles & Driver Management",
    title: "Validate Documents (SOAT & License)",
    description: "As a system, ensure SOAT and driver's license are valid before allowing trip creation.",
    acceptanceCriteria: [
      "Expired documents prevent drivers from creating trips.",
      "Driver is notified to renew documents."
    ],
    checklist: [
      "Store document expiry dates in DB.",
      "Implement check on trip creation endpoint.",
      "Add UI warnings in driver dashboard.",
      "Notify via push/email when documents near expiry."
    ],
    labels: ["Epic: Vehicles", "Backend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "/vehicles/documents/validate",
      method: "GET / POST",
      sideNote: "Verifies expiration dates of SOAT and driver’s license; block trip creation if expired."
    }
  },
  {
    id: "story-12",
    slug: "create-trip",
    epic: "Trip Management",
    title: "Create Trip (Driver)",
    description:
      "As a driver, I want to create a trip with start, destination, route, time, seats and price so passengers can book.",
    acceptanceCriteria: [
      "Trip stored with required fields; seats ≤ selected vehicle capacity.",
      "Trip visible to passengers after creation."
    ],
    checklist: [
      "Design trip creation screen in Figma.",
      "Implement frontend creation form & validation.",
      "Backend endpoint POST /trips and DB schema.",
      "Integrate distance/time calculation (Maps API) to suggest tariff.",
      "Set default status pending or scheduled.",
      "Add tests & Swagger docs."
    ],
    labels: ["Epic: Trips", "Frontend", "Backend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "/trips",
      method: "POST",
      sideNote:
        "Creates a new trip linked to a driver and vehicle. Validate that available seats ≤ vehicle capacity and that documents are valid."
    }
  },
  {
    id: "story-13",
    slug: "add-pickup-points",
    epic: "Trip Management",
    title: "Add Pickup Points (Driver)",
    description: "As a driver, I want to add pickup points, so passengers know where to board.",
    acceptanceCriteria: [
      "Pickup points displayed on trip details and map.",
      "Passengers can select pickup points during reservation."
    ],
    checklist: [
      "Design pickup point UI in Figma.",
      "Allow adding pickup points when creating/editing trip.",
      "Store pickup points with coordinates in DB.",
      "Show pickup points on trip detail map.",
      "Ensure passenger reservation requires selecting a pickup point."
    ],
    labels: ["Epic: Trips", "Frontend", "Backend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "/trips/:id/pickups",
      method: "POST / PUT",
      sideNote: "Adds or edits pickup points with coordinates. Passengers must select a pickup when booking."
    }
  },
  {
    id: "story-14",
    slug: "calculate-distance-eta",
    epic: "Trip Management",
    title: "Calculate Distance & Estimated Time (System)",
    description:
      "As a system, I want to calculate distance and ETA using OpenRouteService so users get accurate trip info.",
    acceptanceCriteria: [
      "Distance and ETA stored and displayed in trip details.",
      "Request rate limits handled gracefully."
    ],
    checklist: [
  "Integrate OpenRouteService directions API.",
      "Backend service to calculate and cache distances.",
      "Display distance and ETA in frontend trip details.",
      "Implement caching (Redis) for repeated queries."
    ],
    labels: ["Epic: Trips", "Structure", "Backend"],
    priority: "High",
    apiContract: {
      endpoint: "/maps/calculate",
      method: "POST",
  sideNote: "Internal service using OpenRouteService. Cache repeated distance calculations for efficiency."
    }
  },
  {
    id: "story-15",
    slug: "suggest-tariff",
    epic: "Trip Management",
    title: "Suggest Tariff (System)",
    description:
      "As a system, I want to suggest a tariff based on distance, time and inflation so drivers can price fairly.",
    acceptanceCriteria: [
      "System gives suggested price; driver may edit within allowed range.",
      "Formula documented."
    ],
    checklist: [
      "Define tariff formula (base + kmrate + minrate).",
      "Implement calculation service in backend.",
      "Provide driver UI to view & adjust suggested tariff within ±20%.",
      "Store final tariff chosen."
    ],
    labels: ["Epic: Trips", "Backend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "/trips/tariff/suggest",
      method: "POST",
      sideNote: "Suggests a price based on distance/time. Driver can edit the price within an allowed range."
    }
  },
  {
    id: "story-16",
    slug: "view-available-trips",
    epic: "Trip Management",
    title: "View Available Trips (Passenger)",
    description:
      "As a passenger, I want to see available trips with driver, route, seats, price and time so I can choose.",
    acceptanceCriteria: [
      "Lists only trips with seats > 0 and status active/scheduled.",
      "Click to view details."
    ],
    checklist: [
      "Design trip listing cards in Figma.",
      "Implement frontend list and filters.",
      "Backend GET /trips with filtering params.",
      "Real-time updates for seat changes (sockets or firestore).",
      "Pagination and performance optimizations."
    ],
    labels: ["Epic: Trips", "Frontend", "Backend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "/trips",
      method: "GET",
      sideNote:
        "Lists all available trips with filters (price, departure point, seats, time). Supports pagination and live updates."
    }
  },
  {
    id: "story-17",
    slug: "reserve-seats",
    epic: "Trip Management",
    title: "Reserve Seats (Passenger)",
    description: "As a passenger, I want to reserve seats so I secure a place on the trip.",
    acceptanceCriteria: [
      "Seats reserved decrease availability immediately.",
      "Reservation stores passenger, seats count and pickup point."
    ],
    checklist: [
      "Design reservation UI & confirmation in Figma.",
      "Implement frontend reservation flow.",
      "Backend POST /reservations and DB model.",
      "Implement server-side concurrency control (atomic decrement).",
      "Send confirmation notification to driver & passenger."
    ],
    labels: ["Epic: Trips", "Frontend", "Backend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "/reservations",
      method: "POST",
      sideNote:
        "Books seats and decreases availability atomically to prevent overbooking."
    }
  },
  {
    id: "story-18",
    slug: "reserve-multiple-seats",
    epic: "Trip Management",
    title: "Reserve Multiple Seats (Passenger)",
    description:
      "As a passenger, I want to reserve multiple seats in one reservation so I can book for friends.",
    acceptanceCriteria: [
      "Users can pick number of seats up to available.",
      "Each seat can have a pickup point assigned."
    ],
    checklist: [
      "UI to select seat quantity and pickup per seat.",
      "Backend validation for seats quantity.",
      "Update reservation model to include array of pickup points.",
      "Tests for multi-seat reservation edge cases."
    ],
    labels: ["Epic: Trips", "Frontend", "Backend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/reservations",
      method: "POST",
      sideNote: "Allows reserving multiple seats in one request; optionally assign pickup points per seat."
    }
  },
  {
    id: "story-19",
    slug: "block-full-trips",
    epic: "Trip Management",
    title: "Block Full Trips (System)",
    description: "As a system, mark trips as “Full” when no seats remain to prevent overbooking.",
    acceptanceCriteria: [
      "Trip status updates to full and UI reflects disabled booking."
    ],
    checklist: [
      "Implement seat counter logic in backend with atomic checks.",
      "Update trip status when seats == 0.",
      "Disable reservation action in frontend for full trips.",
      "Notify driver that trip is full (optional)."
    ],
    labels: ["Epic: Trips", "Backend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "/trips/:id/status",
      method: "PUT",
      sideNote: "Updates the trip status to “full” when no seats remain. Frontend should disable further bookings."
    }
  },
  {
    id: "story-20",
    slug: "driver-passenger-list",
    epic: "Trip Management",
    title: "Driver Views Passenger List",
    description: "As a driver, I want to see the passenger list and pickup points so I can organize pickup order.",
    acceptanceCriteria: [
      "Driver sees confirmed reservations with passenger name, phone and pickup point."
    ],
    checklist: [
      "Design driver passenger list screen in Figma.",
      "Backend GET /trips/:id/passengers.",
      "Implement frontend dashboard for driver.",
      "Option to export or message passengers (optional)."
    ],
    labels: ["Epic: Trips", "Frontend", "Backend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/trips/:id/passengers",
      method: "GET",
      sideNote: "Lists all confirmed passengers with name, phone, and pickup point. Optionally allow exporting or contacting passengers."
    }
  },
  {
    id: "story-21",
    slug: "filter-by-departure",
    epic: "Search & Filters",
    title: "Filter by Departure Point",
    description:
      "As a passenger, I want to filter trips by departure point (e.g., Puente Madera, Ad Portas) so I only see relevant trips.",
    acceptanceCriteria: [
      "Filter returns only matching trips; UI shows active filter."
    ],
    checklist: [
      "Add departure point filter UI in Figma.",
      "Implement backend filter param departure_point.",
      "Wire frontend filter and update listing query.",
      "Add unit tests for filter logic."
    ],
    labels: ["Epic: Search", "Frontend", "Backend"],
    priority: "High",
    apiContract: {
      endpoint: "/trips?departure_point=",
      method: "GET",
      sideNote: "Filters trips by departure point (e.g., Puente Madera). The active filter should be visible in the UI."
    }
  },
  {
    id: "story-22",
    slug: "filter-by-seats",
    epic: "Search & Filters",
    title: "Filter by Seats Available",
    description: "As a passenger, I want to filter trips by minimum seats available so I only see trips I can book for my party.",
    acceptanceCriteria: [
      "Filter accepts minimum seats and updates list."
    ],
    checklist: [
      "Design seats filter control.",
      "Implement backend min_seats param.",
      "Client-side filter options and test."
    ],
    labels: ["Epic: Search", "Frontend", "Backend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/trips?min_seats=",
      method: "GET",
      sideNote: "Filters trips that have at least the specified number of available seats."
    }
  },
  {
    id: "story-23",
    slug: "filter-by-time-range",
    epic: "Search & Filters",
    title: "Filter by Time Range",
    description: "As a passenger, I want to filter trips by departure time range so I can find trips that fit my schedule.",
    acceptanceCriteria: [
      "Filter by start time and end time and results update accordingly."
    ],
    checklist: [
      "Time range UI (picker) in Figma.",
      "Backend start_time & end_time filtering.",
      "Frontend integration and testing."
    ],
    labels: ["Epic: Search", "Frontend", "Backend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/trips?start_time=&end_time=",
      method: "GET",
      sideNote: "Filters trips by time range; handle time zone and ISO date formatting."
    }
  },
  {
    id: "story-24",
    slug: "filter-by-price",
    epic: "Search & Filters",
    title: "Filter by Maximum Price",
    description: "As a passenger, I want to filter trips by a maximum price, so I only see affordable options.",
    acceptanceCriteria: [
      "Slider or input for max price; results respect the bound."
    ],
    checklist: [
      "Price filter UI in Figma.",
      "Backend max_price filter param.",
      "Frontend binding and test."
    ],
    labels: ["Epic: Search", "Frontend", "Backend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/trips?max_price=",
      method: "GET",
      sideNote: "Filters trips by maximum price; can be combined with pagination and sorting."
    }
  },
  {
    id: "story-25",
    slug: "trip-cancellation-notification",
    epic: "Notifications & Communication",
    title: "Trip Cancellation Notification (Driver cancels)",
    description:
      "As a passenger, I want to receive immediate notification if my trip is canceled so I can make alternative plans.",
    acceptanceCriteria: [
      "Push notification sent to all booked passengers and email fallback."
    ],
    checklist: [
      "Design notification message templates.",
      "Implement backend event trip: cancelled and push/email triggers.",
      "Implement client-side notification handler (in-app).",
      "Tests for notification delivery."
    ],
    labels: ["Epic: Notifications", "Backend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "/trips/:id/cancel",
      method: "PUT",
      sideNote: "Marks the trip as cancelled and sends push/email notifications to all passengers."
    }
  },
  {
    id: "story-26",
    slug: "trip-time-change-notification",
    epic: "Notifications & Communication",
    title: "Trip Time Change Notification",
    description:
      "As a passenger, I want to be notified if the driver changes the departure time so I stay updated.",
    acceptanceCriteria: [
      "All booked passengers receive updated time notification."
    ],
    checklist: [
      "Implement backend event trip: updated with diff detection.",
      "Send push + email to affected passengers.",
      "UI shows updated trip time and history."
    ],
    labels: ["Epic: Notifications", "Backend", "Frontend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/trips/:id",
      method: "PUT",
      sideNote: "Updates the departure time and triggers notifications to all affected passengers."
    }
  },
  {
    id: "story-27",
    slug: "notify-driver-new-reservation",
    epic: "Notifications & Communication",
    title: "Notify Driver of New Reservation",
    description:
      "As a driver, I want to be notified when someone reserves a seat so I can confirm and prepare.",
    acceptanceCriteria: [
      "Driver receives push notification and sees reservation in dashboard."
    ],
    checklist: [
      "Emit event on successful reservation.",
      "Push + email to driver.",
      "Driver trip dashboard update in real time."
    ],
    labels: ["Epic: Notifications", "Backend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "/notifications/driver",
      method: "POST",
      sideNote: "Event emitted when a passenger books a seat; sends push/email notification to the driver."
    }
  },
  {
    id: "story-28",
    slug: "passenger-cancels-reservation",
    epic: "Notifications & Communication",
    title: "Passenger Cancels Reservation",
    description:
      "As a passenger, I want to cancel my reservation so the seat becomes available for others.",
    acceptanceCriteria: [
      "Seats increment back and driver is notified."
    ],
    checklist: [
      "UI flow for cancel reservation in Figma.",
      "Backend DELETE /reservations/:id or state update.",
      "Release seats atomically and notify driver.",
      "Refund/acknowledgment message if applicable (cash/Nequi note)."
    ],
    labels: ["Epic: Notifications", "Frontend", "Backend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/reservations/:id",
      method: "DELETE",
      sideNote: "Cancels the reservation, releases the seat, and notifies the driver. Optionally record cancellation reason."
    }
  },
  {
    id: "story-29",
    slug: "driver-cancels-trip",
    epic: "Notifications & Communication",
    title: "Driver Cancels Trip",
    description:
      "As a driver, I want to cancel a trip so no more passengers attempt to book and current passengers are informed.",
    acceptanceCriteria: [
      "Trip status becomes cancelled and passengers notified immediately."
    ],
    checklist: [
      "Driver cancellation UI & confirmation modal.",
      "Backend PUT /trips/:id/cancel.",
      "Notify all passengers (push + email).",
      "Mark reservations with cancelled status."
    ],
    labels: ["Epic: Notifications", "Frontend", "Backend"],
    priority: "High",
    apiContract: {
      endpoint: "/trips/:id/cancel",
      method: "PUT",
      sideNote: "Cancels the trip, notifies passengers, and marks reservations as cancelled."
    }
  },
  {
    id: "story-30",
    slug: "trip-reminder-notifications",
    epic: "Notifications & Communication",
    title: "Trip Reminder Notifications",
    description:
      "As a system, I want to send reminders to driver and passengers before trip departure so everyone is punctual.",
    acceptanceCriteria: [
      "Reminders sent 60 and/or 30 minutes prior (configurable)."
    ],
    checklist: [
      "Scheduler service to queue reminders.",
      "Push & email reminder templates.",
      "Configurable reminder times in settings."
    ],
    labels: ["Epic: Notifications", "Structure", "Backend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/notifications/reminder",
      method: "POST",
      sideNote: "Sends reminders 60 or 30 minutes before departure using background jobs or schedulers."
    }
  },
  {
    id: "story-31",
    slug: "rate-driver",
    epic: "Ratings & Safety",
    title: "Rate Driver",
    description:
      "As a passenger, I want to rate the driver after a trip so I can provide feedback and help maintain quality.",
    acceptanceCriteria: [
      "Rating (1–5 stars) saved and associated with trip and driver."
    ],
    checklist: [
      "Star rating UI (modal) in Figma.",
      "Frontend flow to submit rating post-trip.",
      "Backend POST /ratings and average calculation.",
      "Display driver average rating on profile and trips."
    ],
    labels: ["Epic: Ratings", "Frontend", "Backend"],
    priority: "Medium",
    apiContract: {
      endpoint: "/ratings/driver",
      method: "POST",
      sideNote: "Allows passengers to rate the driver after completing the trip."
    }
  },
  {
    id: "story-32",
    slug: "rate-passengers",
    epic: "Ratings & Safety",
    title: "Rate Passengers (Driver)",
    description:
      "As a driver, I want to rate passengers after trips so community trust is maintained.",
    acceptanceCriteria: [
      "Driver can submit ratings for passengers; stored and used for moderation."
    ],
    checklist: [
      "Driver rating UI.",
      "Backend endpoint to save passenger ratings.",
      "Display passenger average rating in profile."
    ],
    labels: ["Epic: Ratings", "Frontend", "Backend"],
    priority: "Low",
    apiContract: {
      endpoint: "/ratings/passenger",
      method: "POST",
      sideNote: "Allows the driver to rate passengers. Only one rating per passenger per trip."
    }
  },
  {
    id: "story-33",
    slug: "display-average-rating",
    epic: "Ratings & Safety",
    title: "Display Average Rating on Profiles",
    description:
      "As a user, I want to see average ratings on driver/passenger profiles so I can choose trusted partners.",
    acceptanceCriteria: [
      "Average rating visible on profile and trip cards."
    ],
    checklist: [
      "Add rating field to profile UI.",
      "Backend aggregation query to compute averages.",
      "Cache averages for performance (update on new rating)."
    ],
    labels: ["Epic: Ratings", "Frontend", "Backend", "Structure"],
    priority: "Medium",
    apiContract: {
      endpoint: "/ratings/average/:userId",
      method: "GET",
      sideNote: "Returns a user’s average rating. Cache results and update when a new rating is added."
    }
  },
  {
    id: "story-34",
    slug: "encrypt-passwords-protect-pii",
    epic: "Ratings & Safety",
    title: "Encrypt Passwords & Protect PII",
    description:
      "As a system, I must encrypt passwords and protect personal data to comply with privacy rules.",
    acceptanceCriteria: [
      "Passwords hashed; PII stored and accessed securely."
    ],
    checklist: [
      "Use bcrypt/argon2 for passwords.",
      "Use TLS for all transport.",
      "Limit PII exposure in APIs; audit logs.",
      "Data retention policy and delete flows."
    ],
    labels: ["Epic: Safety", "Backend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "/auth/register",
      method: "POST",
      sideNote: "Apply security best practices — use bcrypt/Argon2, HTTPS/TLS, and limit personally identifiable data in responses."
    }
  },
  {
    id: "story-35",
    slug: "system-availability",
    epic: "Ratings & Safety",
    title: "System Availability (Uptime)",
    description:
      "As a stakeholder, I want the app to be available ≥99% so students rely on it.",
    acceptanceCriteria: [
      "Monitoring and alerts in place; SLA defined."
    ],
    checklist: [
      "Setup monitoring (Prometheus/Sentry/NewRelic).",
      "Setup alerts and on-call runs.",
      "Define maintenance windows and fallback modes."
    ],
    labels: ["Epic: Safety", "Structure", "Backend"],
    priority: "High",
    apiContract: {
      endpoint: "/health",
      method: "GET",
      sideNote: "Simple health check endpoint for monitoring and uptime verification."
    }
  },
  {
    id: "story-36",
    slug: "cash-nequi-option",
    epic: "Payments (Future)",
    title: "Cash / Nequi Payment Option (Informational)",
    description:
      "As a passenger, I want to pay by cash or Nequi to the driver so I can use the service without in-app payments.",
    acceptanceCriteria: [
      "Payment method recorded on reservation but no real transaction processed."
    ],
    checklist: [
      "Add payment method selector to reservation flow.",
      "Show payment instructions to passenger & driver.",
      "Record payment method in reservation record."
    ],
    labels: ["Epic: Payments", "Frontend", "Backend"],
    priority: "Low",
    apiContract: {
      endpoint: "/reservations/:id/payment",
      method: "PUT",
      sideNote: "Saves the selected payment method (cash or Nequi) without processing transactions. Displays payment instructions."
    }
  },
  {
    id: "story-37",
    slug: "driver-payment-history",
    epic: "Payments (Future)",
    title: "Driver Payment History (Manual)",
    description:
      "As a driver, I want to see a history of reservations and manual payments so I can track earnings.",
    acceptanceCriteria: [
      "Driver sees reservations and a field where they mark payment received (cash/Nequi)."
    ],
    checklist: [
      "Design earnings/history screen.",
      "Backend query for driver reservations and payment status.",
      "UI toggle to mark payment received."
    ],
    labels: ["Epic: Payments", "Frontend", "Backend"],
    priority: "Low",
    apiContract: {
      endpoint: "/drivers/:id/payments",
      method: "GET",
      sideNote: "Returns manually recorded payments per trip, with filters for date and payment status."
    }
  },
  {
    id: "story-38",
    slug: "online-payments-integration",
    epic: "Payments (Future)",
    title: "Online Payments Integration (Future)",
    description:
      "As a system, I want the option to integrate in the future with Nequi or similar so we enable in-app payments.",
    acceptanceCriteria: [
      "Architecture allows adding payments provider without major refactor."
    ],
    checklist: [
      "Design payments abstraction in backend.",
      "Research Nequi / MercadoPago APIs and compliance.",
      "Leave hooks in frontend for payment flow."
    ],
    labels: ["Epic: Payments", "Structure", "Backend"],
    priority: "Low",
    apiContract: {
      endpoint: "/payments/checkout",
      method: "POST",
      sideNote: "Placeholder for future integration with Nequi or MercadoPago. Design backend abstraction to avoid tight coupling."
    }
  },
  {
    id: "story-39",
    slug: "responsive-design",
    epic: "Infra & Performance",
    title: "Responsive Design (UI)",
    description:
      "As a user, I want the app to work on phone, tablet and desktop so I can use it anywhere.",
    acceptanceCriteria: [
      "Key screens render correctly on common breakpoints."
    ],
    checklist: [
      "Define responsive breakpoints and grids in design system.",
      "Implement responsive CSS/containers.",
      "Test on mobile and desktop."
    ],
    labels: ["Epic: Infra", "Frontend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "Design system guidance",
      method: "N/A",
      sideNote: "Establish responsive tokens and layout primitives consumed by core pages."
    }
  },
  {
    id: "story-40",
    slug: "page-api-load-times",
    epic: "Infra & Performance",
    title: "Page & API Load Times < 2s",
    description:
      "As a user, I expect critical screens to load in under 2 seconds for good UX.",
    acceptanceCriteria: [
      "Home/list pages meet LCP/TTI targets; API median latency within target."
    ],
    checklist: [
      "SSR/SSG strategy (Next.js) for landing pages.",
      "Add caching (CDN) and API caching (Redis).",
      "Optimize images & lazy-load maps.",
      "Add performance monitoring."
    ],
    labels: ["Epic: Infra", "Frontend", "Backend", "Structure"],
    priority: "High",
    apiContract: {
      endpoint: "Performance budgets",
      method: "N/A",
      sideNote: "Document latency targets and observability endpoints supporting <2s experiences."
    }
  },
  {
    id: "story-41",
    slug: "scalable-architecture",
    epic: "Infra & Performance",
    title: "Scalable Architecture",
    description:
      "As a system, I want architecture that can scale horizontally so the app supports many users.",
    acceptanceCriteria: [
      "Stateless API, scalable DB, and autoscaling configured."
    ],
    checklist: [
      "Deploy to cloud with autoscaling (Cloud Run / ECS / GKE).",
      "Use managed MongoDB Atlas and Redis.",
      "Design health checks and load testing plan."
    ],
    labels: ["Epic: Infra", "Structure", "Backend"],
    priority: "High",
    apiContract: {
      endpoint: "Deployment topology",
      method: "N/A",
      sideNote: "Establish infrastructure diagrams and IaC modules for autoscaling workloads."
    }
  },
  {
    id: "story-42",
    slug: "api-integrations",
    epic: "Infra & Performance",
    title: "API Integrations (Maps, Waze, TransMilenio)",
    description:
      "As a system, I want to integrate Maps, Waze and TransMilenio data to improve routing and options.",
    acceptanceCriteria: [
      "Maps used for geocoding/directions; Waze deep-link available; TransMilenio data consumed if available."
    ],
    checklist: [
  "Integrate OpenRouteService (key management).",
      "Implement Waze deep-link and driver option to open Waze.",
      "Ingest TransMilenio open data for paradas if applicable.",
      "Create fallback flows if APIs fail (graceful degrade)."
    ],
    labels: ["Epic: Infra", "Structure", "Backend"],
    priority: "High",
    apiContract: {
      endpoint: "/integrations/maps, /integrations/transmilenio",
      method: "GET / POST",
      sideNote: "Interfaces for external APIs (Maps/Waze/TransMilenio). Manage API keys and fallbacks safely."
    }
  },
  {
    id: "story-43",
    slug: "real-time-updates",
    epic: "Infra & Performance",
    title: "Real-time Updates & Sockets (Seat availability)",
    description:
      "As a user, I want seat counts and trip changes to update in real time so I see current availability.",
    acceptanceCriteria: [
      "Seat availability updates instantly on list & detail views."
    ],
    checklist: [
      "Decide socket strategy (Socket.IO) or Firestore realtime.",
      "Implement backend socket server or Firestore listeners.",
      "Emit events on reservation create/cancel and trip update.",
      "Frontend listeners update UI and show visual change indicators."
    ],
    labels: ["Epic: Infra", "Structure", "Backend", "Frontend"],
    priority: "High",
    apiContract: {
      endpoint: "/socket.io",
      method: "WebSocket / Event",
      sideNote: "Real-time channel for updating seat availability and trip changes instantly across connected clients."
    }
  },
  {
    id: "story-44",
    slug: "error-states-for-forms",
    epic: "Design System",
    title: "Error States for Forms (Desktop & Mobile)",
    description:
      "As a user, I want clear visual feedback when I make mistakes filling out forms, so that I can understand what went wrong and fix it easily.",
    acceptanceCriteria: [
      "All main forms display proper error states.",
      "Fields with errors are visually highlighted.",
      "Error messages appear clearly below the affected field or as a banner.",
      "Designs are provided for both Desktop and Mobile."
    ],
    checklist: [
      "Design error states in Figma for each form.",
      "Add error messages for invalid inputs (email, password, required fields, etc.).",
      "Ensure consistent layout and visual hierarchy for all messages.",
      "Export screens and include naming convention: error_state_[form_name].png.",
      "Review accessibility: contrast and message clarity.",
      "Validate design with the dev team before integration."
    ],
    labels: [
      "Epic: Infra & Performance",
      "Notifications & Communication",
      "Structure",
      "Frontend"
    ],
    priority: "High",
    apiContract: {
      endpoint: "UI asset delivery",
      method: "N/A",
      sideNote: "Document error specs consumed by Registration, Login, Password Recovery, Vehicle, Trip and Reservation forms."
    }
  }
];

export function getStoryBySlug(slug) {
  return stories.find((story) => story.slug === slug);
}
