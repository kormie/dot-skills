window.KanbanApp = {
  // State
  selectedCard: null,
  tickets: { todo: [], 'in-progress': [], 'ready-to-review': [], done: [] },
  currentView: 'board',
  currentEditTicket: null,
  currentEditColumn: null,
  isNewTicket: false,
  showDone: localStorage.getItem('kanban-show-done') === 'true',
  workstreams: [],
  activeWorkstreamFilter: null,

  async loadTickets() {
    const board = document.getElementById('board');
    const doneColumn = document.getElementById('doneColumn');

    try {
      const response = await fetch('/api/tickets?includeDone=true');
      if (!response.ok) throw new Error('Failed to fetch tickets');

      this.tickets = await response.json();
      this.tickets.done = this.tickets.done || [];

      window.KanbanBoard.renderColumn('todo', this.tickets.todo || []);
      window.KanbanBoard.renderColumn('in-progress', this.tickets['in-progress'] || []);
      window.KanbanBoard.renderColumn('ready-to-review', this.tickets['ready-to-review'] || []);

      if (this.showDone) {
        doneColumn.style.display = '';
        window.KanbanBoard.renderColumn('done', this.tickets.done);
      } else {
        doneColumn.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      board.innerHTML = `
        <div class="loading">
          Failed to load tickets. Make sure the server is running.
        </div>
      `;
    }
  },

  switchView(view) {
    this.currentView = view;
    const boardViewBtn = document.getElementById('boardViewBtn');
    const tableViewBtn = document.getElementById('tableViewBtn');
    const swimlaneViewBtn = document.getElementById('swimlaneViewBtn');
    const board = document.getElementById('board');
    const tableView = document.getElementById('tableView');
    const swimlaneView = document.getElementById('swimlaneView');
    const workstreamRibbon = document.getElementById('workstreamRibbon');

    boardViewBtn.classList.remove('active');
    tableViewBtn.classList.remove('active');
    swimlaneViewBtn.classList.remove('active');

    board.classList.add('hidden');
    tableView.classList.remove('active');
    swimlaneView.classList.remove('active');

    workstreamRibbon.style.display = '';

    if (view === 'board') {
      boardViewBtn.classList.add('active');
      board.classList.remove('hidden');
    } else if (view === 'table') {
      tableViewBtn.classList.add('active');
      tableView.classList.add('active');
      window.KanbanTable.renderTable();
    } else if (view === 'swimlane') {
      swimlaneViewBtn.classList.add('active');
      swimlaneView.classList.add('active');
      workstreamRibbon.style.display = 'none';
      window.KanbanSwimlane.renderSwimlanes();
    }
  },

  toggleShowDone() {
    this.showDone = !this.showDone;
    localStorage.setItem('kanban-show-done', this.showDone);
    this.updateDoneToggleUI();
    this.loadTickets().then(() => {
      if (this.currentView === 'table') window.KanbanTable.renderTable();
      else if (this.currentView === 'swimlane') window.KanbanSwimlane.renderSwimlanes();
    });
  },

  updateDoneToggleUI() {
    const btn = document.getElementById('doneToggleBtn');
    if (this.showDone) btn.classList.add('active');
    else btn.classList.remove('active');
  },

  connectSSE() {
    const self = this;
    const events = new EventSource('/api/events');

    events.onmessage = (event) => {
      if (event.data === 'refresh') {
        self.loadTickets().then(() => {
          if (self.currentView === 'table') window.KanbanTable.renderTable();
          else if (self.currentView === 'swimlane') window.KanbanSwimlane.renderSwimlanes();
        });
        window.KanbanWorkstream.loadWorkstreams();
      }
    };

    events.onerror = () => {
      events.close();
      setTimeout(() => self.connectSSE(), 3000);
    };
  },

  init() {
    // View toggles
    document.getElementById('boardViewBtn').addEventListener('click', () => this.switchView('board'));
    document.getElementById('tableViewBtn').addEventListener('click', () => this.switchView('table'));
    document.getElementById('swimlaneViewBtn').addEventListener('click', () => this.switchView('swimlane'));

    // Done toggle
    document.getElementById('doneToggleBtn').addEventListener('click', () => this.toggleShowDone());
    this.updateDoneToggleUI();

    // Refresh board alias
    window.refreshBoard = () => this.loadTickets();

    // Init submodules
    window.KanbanEditor.init();
    window.KanbanWorkstream.initListeners();

    // Initial data load
    this.loadTickets();
    window.KanbanWorkstream.loadWorkstreams();

    // Real-time updates
    this.connectSSE();
  }
};

// Boot
window.KanbanApp.init();
