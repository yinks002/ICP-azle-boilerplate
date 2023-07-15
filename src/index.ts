import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Creates an object type for contact
type Contact = Record<{
  id: string;
  name: string;
  email: string; // Fix: Change the type to string
  number: string;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Defining a payload type
type ContactPayload = Record<{
  name: string;
  email: string; // Fix: Change the type to string
  number: string;
}>;

const ContactSave = new StableBTreeMap<string, Contact>(0, 44, 512);

// Function to get all contacts
$query
export function getAllContacts(): Result<Vec<Contact>, string> {
  return Result.Ok(ContactSave.values());
}

// Function for a user to create a new contact... a user can create multiple contacts
$update
export function createContact(payload: ContactPayload): Result<Contact, string> {
  const contact: Contact = {
    ...payload,
    id: uuidv4(),
    createdAt: Date.now(), // Fix: Change ic.time() to Date.now()
    updatedAt: Opt.None,
  };
  ContactSave.insert(contact.id, contact);
  return Result.Ok(contact);
}

// Function to delete a contact by contact id
$update
export function deleteContact(id: string): Result<Contact, string> {
  return match(ContactSave.remove(id), {
    Some: (removedContact) => Result.Ok<Contact, string>(removedContact),
    None: () => Result.Err<Contact, string>(`Contact with id=${id} not found.`),
  });
}

// Function to update any contact in the cannister
$update
export function updateContact(
  id: string,
  name: string,
  email: string,
  number: string
): Result<Contact, string> {
  return match(ContactSave.get(id), {
    Some: (contact) => {
      const updatedContact: Contact = {
        ...contact,
        name,
        email, // Fix: Update the email field
        number,
        updatedAt: Opt.Some(ic.time()),
      };
      ContactSave.insert(updatedContact.id, updatedContact); // Fix: Use updatedContact.id instead of contact.id
      return Result.Ok<Contact, string>(updatedContact);
    },
    None: () => Result.Err<Contact, string>(`Contact with id=${id} not found.`),
  });
}

// A workaround to make the uuid package work with Azle
globalThis.crypto = {
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
