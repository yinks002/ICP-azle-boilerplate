// this is a public contact system app that allows user to create a contact profile and also view other users contact
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

//creates an object type todo
type Contact = Record<{
    id: string;
    name: string;
    email: boolean;
    number: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>;

//defining a payload 
type ContactPayload = Record<{
    name: string;
    email: boolean;
    number: string;
}>;

const ContactSave = new StableBTreeMap<string, Contact>(0, 44, 512);

$query
export function getAllContacts(): Result<Vec<Contact>, string> {
    return Result.Ok(ContactSave.values());
}

//func to get all contact
$update
export function createContact(payload: ContactPayload): Result<Contact, string> {
    // Input validation
    if (!payload.name || payload.name.trim() === '') {
        return Result.Err('Name is required.');
    }

    if (!payload.number || payload.number.trim() === '') {
        return Result.Err('Number is required.');
    }

    // Check for duplicate contacts
    const existingContact = ContactSave.values().find(contact => contact.name === payload.name);
    if (existingContact) {
        return Result.Err('A contact with the same name already exists.');
    }

    const contact: Contact = {
        ...payload,
        id: uuidv4(),
        createdAt: ic.time(),
        updatedAt: Opt.None,
    };

    ContactSave.insert(contact.id, contact);
    return Result.Ok(contact);
}

//func for a user to create a new contact.....a user can create mutiple  contacts
$update
export function deleteContact(id: string): Result<Contact, string> {
    const contact = ContactSave.get(id);
    if (contact) {
        ContactSave.remove(id);
        return Result.Ok(contact);
    } else {
        return Result.Err(`Contact with ID ${id} not found.`);
    }
}

//allows a user to delete a contact by contact id
$update
export function updateContact(
    id: string,
    name: string,
    email: boolean,
    number: string
): Result<Contact, string> {
    const contact = ContactSave.get(id);
    if (contact) {
        const updatedContact: Contact = {
            ...contact,
            name,
            email,
            number,
            updatedAt: Opt.Some(ic.time()),
        };
        ContactSave.insert(contact.id, updatedContact);
        return Result.Ok(updatedContact);
    } else {
        return Result.Err(`Contact with ID ${id} not found.`);
    }
}

globalThis.crypto = {
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    },
};
