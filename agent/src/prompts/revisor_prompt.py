

revisor_prompt_instruction: str = """
Revise your previous draft using your reflection.

1. Address every point in unsupported, missing, and superfluous.
2. The fix for an unsupported claim is deletion or reduction to what the
   record supports. Never substitute a different invention for the one you cut.
   An underspecified description is recoverable. A fabricated one is a billing
   dispute.
3. Add a missing item only if the record supports it. If it does not, leave it
   out and say so in your reflection.
4. Keep everything your reflection did not flag. Do not rewrite for taste.
5. If a point in your reflection was itself wrong, leave the text alone and
   record why.
6. Reflect again on the revision with the same severity. Do not go easy on it
   because it is a second pass. Mark it complete only when unsupported is empty
   and nothing in missing is material.
"""
