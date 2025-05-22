document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const columnsContainer = document.getElementById("columns-container");
  const addColumnBtn = document.getElementById("add-column-btn");
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modal-title");
  const modalInput = document.getElementById("modal-input");
  const modalSubmit = document.getElementById("modal-submit");
  const closeBtn = document.querySelector(".close-btn");

  // State
  let board = {
    columns: [],
  };
  let currentAction = null;
  let currentColumnId = null;
  let currentCardId = null;

  // Initialize the app
  function init() {
    loadBoard();
    renderBoard();
    setupEventListeners();
  }

  // Load board from localStorage
  function loadBoard() {
    const savedBoard = localStorage.getItem("trello-clone-board");
    if (savedBoard) {
      board = JSON.parse(savedBoard);
    } else {
      // Default board with one example column
      board = {
        columns: [
          {
            id: generateId(),
            title: "لیست کارها",
            cards: [
              { id: generateId(), content: "کار نمونه 1" },
              { id: generateId(), content: "کار نمونه 2" },
            ],
          },
        ],
      };
      saveBoard();
    }
  }

  // Save board to localStorage
  function saveBoard() {
    localStorage.setItem("trello-clone-board", JSON.stringify(board));
  }

  // Render the entire board
  function renderBoard() {
    columnsContainer.innerHTML = "";

    board.columns.forEach((column) => {
      const columnElement = createColumnElement(column);
      columnsContainer.appendChild(columnElement);
    });
  }

  // Create a column element
  function createColumnElement(column) {
    const columnElement = document.createElement("div");
    columnElement.className = "column";
    columnElement.dataset.columnId = column.id;

    const columnHeader = document.createElement("div");
    columnHeader.className = "column-header";

    const columnTitle = document.createElement("div");
    columnTitle.className = "column-title";
    columnTitle.textContent = column.title;
    columnTitle.addEventListener("click", () => {
      openModal("ویرایش عنوان ستون", column.title, "edit-column-title");
      currentColumnId = column.id;
    });

    const columnActions = document.createElement("div");
    columnActions.className = "column-actions";

    const deleteColumnBtn = document.createElement("button");
    deleteColumnBtn.innerHTML = "&times;";
    deleteColumnBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteColumn(column.id);
    });

    columnActions.appendChild(deleteColumnBtn);
    columnHeader.appendChild(columnTitle);
    columnHeader.appendChild(columnActions);

    const cardsList = document.createElement("div");
    cardsList.className = "cards-list";

    column.cards.forEach((card) => {
      const cardElement = createCardElement(card, column.id);
      cardsList.appendChild(cardElement);
    });

    const addCardBtn = document.createElement("button");
    addCardBtn.className = "add-card-btn";
    addCardBtn.textContent = "+ افزودن کارت";
    addCardBtn.addEventListener("click", () => {
      openModal("افزودن کارت جدید", "", "add-card");
      currentColumnId = column.id;
    });

    columnElement.appendChild(columnHeader);
    columnElement.appendChild(cardsList);
    columnElement.appendChild(addCardBtn);

    // Setup drag and drop for column
    setupColumnDragAndDrop(columnElement, column.id);

    return columnElement;
  }

  // Create a card element
  function createCardElement(card, columnId) {
    const cardElement = document.createElement("div");
    cardElement.className = "card";
    cardElement.dataset.cardId = card.id;
    cardElement.dataset.columnId = columnId;
    cardElement.draggable = true;

    const cardContent = document.createElement("div");
    cardContent.className = "card-content";
    cardContent.textContent = card.content;

    const cardActions = document.createElement("div");
    cardActions.className = "card-actions";

    const editCardBtn = document.createElement("button");
    editCardBtn.textContent = "ویرایش";
    editCardBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal("ویرایش کارت", card.content, "edit-card");
      currentCardId = card.id;
      currentColumnId = columnId;
    });

    const deleteCardBtn = document.createElement("button");
    deleteCardBtn.textContent = "حذف";
    deleteCardBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteCard(card.id, columnId);
    });

    cardActions.appendChild(editCardBtn);
    cardActions.appendChild(deleteCardBtn);
    cardElement.appendChild(cardContent);
    cardElement.appendChild(cardActions);

    // Setup drag and drop for card
    setupCardDragAndDrop(cardElement, card.id, columnId);

    return cardElement;
  }

  // Setup drag and drop for a column
  function setupColumnDragAndDrop(columnElement, columnId) {
    columnElement.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer.types.includes("text/plain")) {
        e.dataTransfer.dropEffect = "move";
        columnElement.classList.add("drop-target");
      }
    });

    columnElement.addEventListener("dragleave", () => {
      columnElement.classList.remove("drop-target");
    });

    columnElement.addEventListener("drop", (e) => {
      e.preventDefault();
      columnElement.classList.remove("drop-target");

      if (e.dataTransfer.types.includes("text/plain")) {
        const sourceColumnId = e.dataTransfer.getData("source-column-id");
        const cardId = e.dataTransfer.getData("card-id");

        if (sourceColumnId !== columnId) {
          moveCardToColumn(cardId, sourceColumnId, columnId);
        }
      }
    });
  }

  // Setup drag and drop for a card
  function setupCardDragAndDrop(cardElement, cardId, columnId) {
    cardElement.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("card-id", cardId);
      e.dataTransfer.setData("source-column-id", columnId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "card"); //EDIT
      cardElement.classList.add("dragging");

      // Set drag image to be the card itself
      e.dataTransfer.setDragImage(cardElement, 0, 0);
    });

    cardElement.addEventListener("dragend", () => {
      cardElement.classList.remove("dragging");
    });
  }

  // Open modal with specific action
  function openModal(title, initialValue, action) {
    modalTitle.textContent = title;
    modalInput.value = initialValue;
    currentAction = action;
    modal.style.display = "flex";
    modalInput.focus();
  }

  // Close modal
  function closeModal() {
    modal.style.display = "none";
    currentAction = null;
    currentColumnId = null;
    currentCardId = null;
  }

  // Add a new column
  function addColumn(title) {
    const newColumn = {
      id: generateId(),
      title: title,
      cards: [],
    };

    board.columns.push(newColumn);
    saveBoard();
    renderBoard();
  }

  // Edit column title
  function editColumnTitle(columnId, newTitle) {
    const column = board.columns.find((col) => col.id === columnId);
    if (column) {
      column.title = newTitle;
      saveBoard();
      renderBoard();
    }
  }

  // Delete a column
  function deleteColumn(columnId) {
    board.columns = board.columns.filter((col) => col.id !== columnId);
    saveBoard();
    renderBoard();
  }

  // Add a new card to a column
  function addCard(columnId, content) {
    const column = board.columns.find((col) => col.id === columnId);
    if (column) {
      const newCard = {
        id: generateId(),
        content: content,
      };

      column.cards.push(newCard);
      saveBoard();
      renderBoard();
    }
  }

  // Edit a card
  function editCard(cardId, columnId, newContent) {
    const column = board.columns.find((col) => col.id === columnId);
    if (column) {
      const card = column.cards.find((c) => c.id === cardId);
      if (card) {
        card.content = newContent;
        saveBoard();
        renderBoard();
      }
    }
  }

  // Delete a card
  function deleteCard(cardId, columnId) {
    const column = board.columns.find((col) => col.id === columnId);
    if (column) {
      column.cards = column.cards.filter((card) => card.id !== cardId);
      saveBoard();
      renderBoard();
    }
  }

  // Move card to another column
  function moveCardToColumn(cardId, sourceColumnId, targetColumnId) {
    const sourceColumn = board.columns.find((col) => col.id === sourceColumnId);
    const targetColumn = board.columns.find((col) => col.id === targetColumnId);

    if (sourceColumn && targetColumn) {
      const cardIndex = sourceColumn.cards.findIndex(
        (card) => card.id === cardId
      );

      if (cardIndex !== -1) {
        const [card] = sourceColumn.cards.splice(cardIndex, 1);
        targetColumn.cards.push(card);
        saveBoard();
        renderBoard();
      }
    }
  }

  // Generate a unique ID
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Setup event listeners
  function setupEventListeners() {
    // Add column button
    addColumnBtn.addEventListener("click", () => {
      openModal("افزودن ستون جدید", "", "add-column");
    });

    // Modal submit button
    modalSubmit.addEventListener("click", () => {
      const value = modalInput.value.trim();

      if (value) {
        switch (currentAction) {
          case "add-column":
            addColumn(value);
            break;
          case "edit-column-title":
            editColumnTitle(currentColumnId, value);
            break;
          case "add-card":
            addCard(currentColumnId, value);
            break;
          case "edit-card":
            editCard(currentCardId, currentColumnId, value);
            break;
        }

        closeModal();
      }
    });

    // Close modal when clicking X or outside
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Submit on Enter key
    modalInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        modalSubmit.click();
      }
    });
  }

  // Initialize the app
  init();
});
