/**
 * Centralized UI text strings dictionary.
 * Allows easy internationalization (i18n) and RTL support (e.g., Persian/Farsi).
 */
export const strings = {
  app: {
    title: "Family Library",
    subtitle: "A 3D Cozy Personal Library",
    loading: "Loading cozy library...",
    errorGeneric: "An unexpected error occurred. Please try again.",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    search: "Search...",
    filter: "Filter",
    all: "All",
    back: "Back",
    confirmDeleteTitle: "Confirm Deletion",
    confirmDeleteMessage: "Are you sure you want to delete this item? This action cannot be undone."
  },
  nav: {
    street: "Street View",
    room: "Library Room",
    toggleListView: "List View (2D)",
    toggle3DView: "3D Scene",
    logout: "Sign Out",
    welcomeUser: "Welcome back, {name}"
  },
  auth: {
    loginTitle: "Enter Your Library",
    loginSubtitle: "Sign in with your PocketBase account",
    emailLabel: "Email Address",
    passwordLabel: "Password",
    submitButton: "Sign In",
    loggingIn: "Signing in...",
    invalidCredentials: "Invalid email or password. Please try again.",
    sessionExpired: "Your session has expired. Please log in again."
  },
  listView: {
    pageTitle: "Book Collection",
    searchPlaceholder: "Search by title, author, or ISBN...",
    allShelves: "All Shelves",
    allStatuses: "All Statuses",
    statusAvailable: "Available",
    statusLent: "Lent",
    colCover: "Cover",
    colTitle: "Title",
    colAuthor: "Author",
    colShelf: "Shelf",
    colIsbn: "ISBN",
    colStatus: "Status",
    colActions: "Actions",
    noBooksFound: "No books match your current search or filter criteria.",
    addBookBtn: "+ Add Book",
    manageShelvesBtn: "Manage Shelves",
    totalBooksCount: "{count} books in collection"
  },
  shelfOverlay: {
    shelfPrefix: "Shelf: ",
    noBooksOnShelf: "This shelf is currently empty. Add your first book!",
    addBookToShelf: "+ Add Book to this Shelf",
    backToRoom: "← Back to Room",
    filterAvailableOnly: "Available Only",
    filterLentOnly: "Lent Out Only",
    badgeAvailable: "Available",
    badgeLentTo: "Lent to: {name}",
    markReturned: "Mark Returned",
    markLent: "Lend Book",
    editBook: "Edit Details",
    deleteBook: "Delete Book",
    moveBook: "Move Shelf",
    movePrompt: "Select a new shelf for '{title}':"
  },
  bookForm: {
    addTitle: "Add New Book",
    editTitle: "Edit Book",
    lookupIsbn: "Fetch Details",
    lookingUp: "Fetching...",
    isbnLabel: "ISBN-10 or ISBN-13",
    isbnHelp: "Type or scan ISBN to auto-populate from Open Library",
    isbnNotFound: "ISBN not found on Open Library. Please enter details manually.",
    isbnSuccess: "Book details fetched successfully!",
    titleLabel: "Book Title *",
    authorLabel: "Author(s) *",
    shelfLabel: "Shelf Category *",
    notesLabel: "Personal Notes",
    lendableLabel: "Allow this book to be lent out",
    coverUrlLabel: "Cover Image URL",
    coverUploadLabel: "Or Upload Local Cover Image",
    statusLabel: "Lending Status",
    lentToLabel: "Lent To (Person's Name)",
    lentAtLabel: "Lent On Date",
    saving: "Saving book...",
    deleteConfirm: "Are you sure you want to remove '{title}' from your library?"
  },
  shelfForm: {
    manageTitle: "Manage Shelves",
    addShelfTitle: "Add New Shelf",
    editShelfTitle: "Edit Shelf",
    nameLabel: "Shelf Name *",
    categoryLabel: "Category Key *",
    sortOrderLabel: "Sort Order",
    saveShelf: "Save Shelf",
    deleteShelf: "Delete Shelf",
    deleteShelfWarning: "Deleting this shelf will NOT delete its books; they will need to be reassigned."
  },
  scene: {
    streetPrompt: "Tap or click on your house to enter",
    houseLabel: "{name}'s Library",
    enteringHouse: "Entering the house...",
    roomPrompt: "Click a shelf to browse books",
    shelfLabel: "{name}"
  },
  toast: {
    bookAdded: "Book '{title}' added to shelf!",
    bookUpdated: "Book '{title}' updated successfully.",
    bookDeleted: "Book '{title}' deleted.",
    bookMoved: "Book '{title}' moved to '{shelf}'.",
    shelfAdded: "Shelf '{name}' created.",
    shelfUpdated: "Shelf '{name}' updated.",
    shelfDeleted: "Shelf '{name}' deleted.",
    statusChanged: "Lending status updated."
  }
};

/**
 * Format string template with variables.
 * e.g. formatString(strings.nav.welcomeUser, { name: 'Ali' })
 */
export function t(template, vars = {}) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}
