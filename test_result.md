#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
user_problem_statement: "Set up preview of imported Quest Closet LARP marketplace. Then: (1) events search was failing - restore it; (2) bring back FR/EN UI toggle; (3) keep 'Step into the mirror' centered and fitted in its frame at all sizes; (4) more catalog variety incl. a club, more golden armor, more specific armor descriptions; (5) when a (voice) stylist request matches no available items, the assistant says 'No items match your query.'"

backend:
  - task: "Guest mode when Clerk keys missing (checkout/orders/payment status accept X-Guest-Id)"
    implemented: true
    working: "NA"
    file: "backend/store.py (signed_user)"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Signed dependency falls back to guest id while CLERK keys unset. Stripe claimable sandbox provisioned (STRIPE_SECRET_KEY in backend/.env)."
  - task: "Catalog expansion + French text (62 items, name_fr/description_fr)"
    implemented: true
    working: "NA"
    file: "backend/fitting_room_catalog.py, backend/catalog_fr.py, backend/fitting_room.py init()"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "20 new items (2 clubs, mace, axe, spear, 6 gilded armor/helm/shield/greaves etc). Armor descriptions rewritten. init() $sets managed text fields every boot."
  - task: "Stylist no-match + language"
    implemented: true
    working: "NA"
    file: "backend/fitting_room.py assistant()"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "AssistantRequest.lang en|fr. Response has no_match bool; when nothing matches reply is exactly 'No items match your query.' (fr: 'Aucun article ne correspond à votre recherche.') with no equips/filters."
  - task: "Events search (bilingual, retries, startup seed, stale cleanup)"
    implemented: true
    working: "NA"
    file: "backend/store.py refresh_events/_refresh_job"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/events/refresh (X-Guest-Id header) runs ~1-2 min in background; GET /api/events/refresh polls state; GET /api/events lists with *_en/*_fr fields."

frontend:
  - task: "FR/EN toggle across site"
    implemented: true
    working: "NA"
    file: "frontend/src/i18n/*, header LangToggle (data-testid lang-toggle-en / lang-toggle-fr)"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Persisted in localStorage qc_lang. Product names/descriptions, events, stylist replies, speech recognition language follow it."
  - task: "Mirror empty state centered/fitted"
    implemented: true
    working: "NA"
    file: "frontend/src/features/fitting-room/SelfieMirror.jsx, fitting-room.css"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Verified 0 overflow at 1920/1300/1100/800/390 in EN and FR."
