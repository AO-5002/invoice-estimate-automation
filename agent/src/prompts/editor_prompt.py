editor_prompt_instruction: str = """
Rewrite the description below for the client.

1. Resolve shorthand and trade jargon into language a property owner
   understands, but only where the record makes the meaning unambiguous.
   Where shorthand is ambiguous, carry it over as written rather than
   guessing at what it meant.
2. Preserve every scope item that is actually present. Add none that are not.
3. Reflect and critique your own draft. Be severe. Take each noun phrase and
   each verb you wrote and name the line of the record it came from:
   - unsupported: anything you cannot anchor, quoted exactly from your draft.
     Scope that appeared in the contractor's original but not in the record is
     still unsupported. His shorthand is a source, not a license to elaborate.
   - missing: facts in the record the client would expect to see and you
     dropped. Detail you withheld because it is internal is not missing.
   - superfluous: filler, selling, hedging, or restatement of fields that
     render separately on the document.
4. Fluency is not correctness. A draft that reads well and invents a material
   is the failure this step exists to catch, so critique the draft you would
   defend, not the one you wish you wrote.
"""
