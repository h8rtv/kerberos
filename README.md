# kerberos

Simple kerberos implementation, with all 6 messages for communication and 4 Actors:
  - Client
  - Authorization Service (AS)
  - Ticket Granting Service (TGS)
  - Greeting Service

## To install dependencies:

```bash
bun install
```

## Usage

```bash
$ mkdir data # creates directory to be store the persistent information
$ bun run mock # generates the database, that should be syncronized in a real kerberos cenario

# In separate terminals...
$ bun run as
$ bun run tgs
$ bun run client
$ bun run greeting
```

## Example

[Screencast from 12-11-2023 15:00:10.webm](https://github.com/h8rtv/kerberos/assets/26033412/087667d4-26ed-42e1-858c-2d1e42972bfe)
