// this is a public contact system app that allows user to create a contact profile and also view other users contact
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

//creates an object type todo
type Contact = Record<{
    id:string;
    name:string;
    email:boolean;
    number: string;
    createdAt:nat64;
    updatedAt: Opt<nat64>
}>

//defining a payload 
type contactPaylaod = Record<{
    name:string;
    email:boolean;
    number: string;
}>

const ContactSave = new StableBTreeMap<string, Contact>(0,44,512);

//func to get all contact
$query;
export function getAllContacts():Result<Vec<Contact>,string>{
    return Result.Ok(ContactSave.values());
}

//func for a user to create a new contact.....a user can create mutiple  contacts
$update;
export function createContact(payload: contactPaylaod): Result<Contact, string>{
    const contact: Contact = {
        ...payload,
        id :uuidv4(),
        createdAt:ic.time(),
        updatedAt: Opt.None,
    }
    ContactSave.insert(contact.id, contact);
    return Result.Ok(contact)
}

//allows a user to delete a contact by contact id
$update
export function deleteContact(id: string): Result<Contact, string>{
    return match (ContactSave.remove(id),{
        Some:(removedContact)=> Result.Ok<Contact, string>(removedContact),
        None: ()=> Result.Err<Contact, string>(`contact with  id=${id} not found.`)
    });
}
//alloows a user to updata any contact on the cannister

$update
export function UpdateContact(id:string, name:string,
    email:boolean,
    number: string):Result<Contact,string>{
        return match(ContactSave.get(id),{
            Some:(contact)=>{
                const updatedContact:Contact={...contact,name,email,number,updatedAt:Opt.Some(ic.time())}
                ContactSave.insert(contact.id,updatedContact)
                return Result.Ok<Contact, string>(updatedContact);
            },
            None: () => Result.Err<Contact, string>(`Contact with id=${id}. not found`)
        }
        )
    };



// //allows  user to fetch contact through contact name

// $query
// export function searchByName( name:string):Result<Vec<Contact>,string> {
//        const contactss = ContactSave.values().filter((name)=>{
//                 return Result.Ok<Vec<Contact>, string>(name);
//        )}
        
//      }   



// a workaround to make uuid package work with Azle
globalThis.crypto = {
    getRandomValues: () => {
        let array = new Uint8Array(32)

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256)
        }

        return array
    }
}