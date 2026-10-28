# Security Specification: KromaChat! 2000s Retro Chat

## 1. Data Invariants
- Each user profile `/profiles/{userId}` can only be created and updated by the user whose `request.auth.uid == userId`.
- Profiles are public to read for authenticated chatters so they can view aliases and text colors, but cannot be modified by anyone else.
- Messages `/messages/{messageId}` can be read by any authenticated user in the room.
- A message cannot be created with a `user_id` that does not match `request.auth.uid`.
- Messages are immutable once sent (cannot be updated or deleted by other users).
- System presence `/rooms/{roomId}/presence/{userId}` can only be written by the matching `userId`.

## 2. Dirty Dozen Attack Payloads
1. **Payload 1 (Identity Spoofing Profile)**: Attacker attempts to create a profile under `/profiles/victim-uid` with `auth.uid = attacker-uid`. -> **PERMISSION_DENIED**
2. **Payload 2 (Ghost Field Attack)**: Attacker attempts to inject `{ isAdmin: true }` into `/profiles/{userId}`. -> **PERMISSION_DENIED**
3. **Payload 3 (Message Impersonation)**: Attacker posts a message with `user_id: "other-user-uid"`. -> **PERMISSION_DENIED**
4. **Payload 4 (Message Content Overflow)**: Attacker posts a message with `contenido` of 10,000 characters. -> **PERMISSION_DENIED**
5. **Payload 5 (Unauthenticated Read)**: Unauthenticated user tries to read `/messages`. -> **PERMISSION_DENIED**
6. **Payload 6 (Unauthenticated Write)**: Unauthenticated user tries to send a message. -> **PERMISSION_DENIED**
7. **Payload 7 (Message Modification)**: User attempts to update another user's message after it is posted. -> **PERMISSION_DENIED**
8. **Payload 8 (Message Deletion)**: Non-admin tries to delete another user's message. -> **PERMISSION_DENIED**
9. **Payload 9 (ID Poisoning Path)**: Attacker creates doc with invalid ID `../../../etc/passwd`. -> **PERMISSION_DENIED**
10. **Payload 10 (Presence Spoofing)**: Attacker attempts to overwrite `/rooms/general-1/presence/victim-uid`. -> **PERMISSION_DENIED**
11. **Payload 11 (Empty Message)**: Attacker creates a message with empty string `contenido: ""`. -> **PERMISSION_DENIED**
12. **Payload 12 (Missing Required Keys)**: Attacker creates a message omitting `alias` or `room_id`. -> **PERMISSION_DENIED**
