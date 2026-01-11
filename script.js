// 1. CONFIGURACIÓN
const CONFIG = {
  EDAD_MIN: 10,
  EDAD_MAX: 18,
  SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycbyWWTmP4gC3Xa4pc59hH1tCzy3PGMuQ-c66mbzAmgd9LpZcCNSmtYdi5hwGqFEqetpgvA/exec",
};

// 2. VALIDATOR (Lógica de Validación)
const Validator = {
  esEmailValido: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),

  // Validación de Cédula: 7 u 8 dígitos numéricos
  esCedulaValida: (cedula) => /^\d{7,8}$/.test(cedula),

  // Validación de Teléfono: 11 dígitos numéricos
  esTelefonoValido: (telefono) => /^\d{11}$/.test(telefono),

  mostrarError: (input, mensaje) => {
    input.classList.add("invalid");
    let errorDiv = input.nextElementSibling;
    // Si el siguiente elemento no es un mensaje de error, crearlo
    if (!errorDiv || !errorDiv.classList.contains("error-msg")) {
      errorDiv = document.createElement("div");
      errorDiv.className = "error-msg";
      input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }
    errorDiv.textContent = mensaje;
  },

  limpiarError: (input) => {
    input.classList.remove("invalid");
    const errorDiv = input.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains("error-msg")) {
      errorDiv.remove();
    }
  },

  validarCampo: (input) => {
    const valor = input.value.trim();
    const esRequerido =
      input.hasAttribute("data-required") &&
      input.getAttribute("data-required") === "true";

    // 1. Validar Requerido
    if (esRequerido && !valor) {
      Validator.mostrarError(input, "Este campo es obligatorio.");
      return false;
    }

    // 2. Validar Email
    if (input.type === "email" && valor && !Validator.esEmailValido(valor)) {
      Validator.mostrarError(input, "Correo electrónico inválido.");
      return false;
    }

    // 3. Validar Cédula (por ID o nombre que contenga 'ci')
    if ((input.id.startsWith("ci") || input.name.startsWith("ci")) && valor) {
      if (!Validator.esCedulaValida(valor)) {
        Validator.mostrarError(input, "La cédula debe tener 7 u 8 dígitos.");
        return false;
      }
    }

    // 4. Validar Teléfonos (por ID o nombre que contenga 'tel' o 'cel')
    if (
      (input.id.startsWith("tel") ||
        input.id.startsWith("cel") ||
        input.id === "contEmerg") &&
      valor
    ) {
      if (!Validator.esTelefonoValido(valor)) {
        Validator.mostrarError(
          input,
          "El teléfono debe tener 11 dígitos (ej. 02551234567)."
        );
        return false;
      }
    }

    // Si pasa todas las validaciones
    Validator.limpiarError(input);
    return true;
  },
};

// 3. UI CONTROLLER (Manejo de Interfaz)
const UI = {
  elements: {
    form: document.getElementById("studentForm"),
    steps: document.querySelectorAll(".form-step"),
    progressBar: document.getElementById("progressBar"),
    prevBtn: document.getElementById("prevStepBtn"),
    nextBtn: document.getElementById("nextStepBtn"),
    submitBtn: document.getElementById("submitForm"),
    formStatus: document.getElementById("formStatus"),
    formDescription: document.getElementById("form-description"),
    enableMadre: document.getElementById("enableMadre"),
    enablePadre: document.getElementById("enablePadre"),
    confirmationModal: document.getElementById("confirmationModal"),
    optionsModal: document.getElementById("optionsModal"),
    notFoundModal: document.getElementById("notFoundModal"),
    continueBtn: document.getElementById("continueBtn"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    closeNotFoundModalBtn: document.getElementById("closeNotFoundModalBtn"),
    imagePreview: document.getElementById("imagePreview"),
    fotoEstBase64: document.getElementById("fotoEstBase64"),
    fotoEstInput: document.getElementById("fotoEst"),
    tieneHermSelect: document.getElementById("tieneHerm"),
    hermanoInfo: document.getElementById("hermanoInfo"),
    nomHerm: document.getElementById("nomHerm"),
    anoHerm: document.getElementById("anoHerm"),
  },

  state: {
    currentStepIndex: 0,
    visibleSteps: ["step1"],
  },

  stepDescriptions: {
    step1:
      "Por favor, completa los datos del estudiante y selecciona las opciones.",
    step2: "Ahora, ingresa los datos de la madre.",
    step3: "A continuación, ingresa los datos del padre.",
    step4: "Finalmente, completa los datos del representante.",
  },

  init: () => {
    UI.setupEventListeners();
    UI.populateSelects();
    UI.setupInputRestrictions();
    // Set initial checkbox label colors
    UI.updateCheckboxLabelColor("enableMadre");
    UI.updateCheckboxLabelColor("enablePadre");
  },

  async searchByCedula(cedula, searchType) {
    if (Validator.esCedulaValida(cedula)) {
      UI.elements.formStatus.textContent = `Buscando datos por C.I. (${searchType})...`;
      UI.elements.formStatus.classList.remove(
        "hidden",
        "text-red-600",
        "text-green-600"
      );
      UI.elements.formStatus.classList.add("text-gray-800");

      try {
        const formData = new FormData();
        formData.append("action", "search");
        formData.append("cedula", cedula);
        formData.append("searchType", searchType); // Add searchType

        const response = await fetch(CONFIG.SCRIPT_URL, {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        if (result.result === "found") {
          UI.elements.formStatus.textContent =
            "Datos encontrados y cargados en el formulario.";
          UI.elements.formStatus.classList.add("text-green-600");

          const studentData = result.data;
          // Rellenar todos los campos del formulario
          for (const key in studentData) {
            const input = document.getElementById(key);
            if (input) {
              if (input.type === "checkbox") {
                input.checked =
                  studentData[key] === "Sí" || studentData[key] === true;
              } else if (key === "cancelado") {
                const values = studentData[key].split(",").map((s) => s.trim());
                const cancelCheckboxes = document.querySelectorAll(
                  '#cancelado-options input[type="checkbox"]'
                );
                cancelCheckboxes.forEach((cb) => {
                  cb.checked = values.includes(cb.value);
                });
                const labels = [];
                document
                  .querySelectorAll("#cancelado-options input:checked")
                  .forEach((cb) => {
                    labels.push(cb.nextElementSibling.textContent);
                  });
                document.querySelector("#cancelado-button span").textContent =
                  labels.length > 0 ? labels.join(", ") : "Selecciona";
                input.value = studentData[key];
              } else {
                input.value = studentData[key];
              }
            }
          }
          // Disparar eventos change para campos que tienen lógica asociada
          document.getElementById("fNacEst").dispatchEvent(new Event("change"));
          document
            .getElementById("tieneHerm")
            .dispatchEvent(new Event("change"));
          UI.updateVisibleSteps();

          // Update checkbox label colors after populating data
          UI.updateCheckboxLabelColor("enableMadre");
          UI.updateCheckboxLabelColor("enablePadre");
        } else if (
          result.result === "not_found" ||
          result.result === "not_found_debug"
        ) {
          UI.elements.formStatus.classList.add("hidden"); // Ocultar mensaje de texto
          UI.elements.notFoundModal.classList.remove("hidden"); // Mostrar modal
        } else {
          // WORKAROUND: Manejar el caso en que el script de backend no se ha desplegado correctamente
          // y devuelve una respuesta de 'success' (crear) durante una acción de 'search'.
          if (result.result === "success") {
            const errorMsg =
              "Error de Despliegue: El script del servidor no está actualizado. Se creó un documento por error en lugar de buscar.\n\nPor favor, contacta al administrador y pídele que realice una 'Nueva Implementación' (New Deployment) en el Google Apps Script.";
            console.error(
              "Error de despliegue obsoleto. El backend devolvió 'success' en una acción de 'search'.",
              result
            );
            UI.elements.formStatus.textContent =
              "Error de Despliegue: El script del servidor no está actualizado.";
            UI.elements.formStatus.classList.add("text-red-600");
            alert(errorMsg);
            throw new Error("Error de despliegue obsoleto."); // Detener la ejecución
          }

          console.log("Respuesta inesperada del backend:", result);
          throw new Error(result.error || "Error desconocido.");
        }
      } catch (error) {
        console.error("Error en la búsqueda:", error);
        UI.elements.formStatus.textContent = error.message;
        UI.elements.formStatus.classList.add("text-red-600");
      }
    }
  },

  updateVisibleSteps: () => {
    UI.state.visibleSteps = ["step1"];
    if (UI.elements.enableMadre.checked) UI.state.visibleSteps.push("step2");
    if (UI.elements.enablePadre.checked) UI.state.visibleSteps.push("step3");
    if (document.getElementById("step4")) UI.state.visibleSteps.push("step4");

    // Ajustar índice si el paso actual desaparece
    if (UI.state.currentStepIndex >= UI.state.visibleSteps.length) {
      UI.state.currentStepIndex = UI.state.visibleSteps.length - 1;
    }
    UI.showCurrentStep();
  },

  showCurrentStep: () => {
    // Ocultar todos
    UI.elements.steps.forEach((step) => step.classList.remove("active"));

    // Mostrar actual
    const currentStepId = UI.state.visibleSteps[UI.state.currentStepIndex];
    document.getElementById(currentStepId).classList.add("active");

    // Actualizar textos y barra
    UI.elements.formDescription.textContent =
      UI.stepDescriptions[currentStepId];

    const progress =
      ((UI.state.currentStepIndex + 1) / UI.state.visibleSteps.length) * 100;
    UI.elements.progressBar.style.width = `${progress}%`;

    // Botones
    if (UI.state.currentStepIndex === 0) {
      UI.elements.prevBtn.classList.add("hidden");
    } else {
      UI.elements.prevBtn.classList.remove("hidden");
    }

    if (UI.state.currentStepIndex === UI.state.visibleSteps.length - 1) {
      UI.elements.nextBtn.classList.add("hidden");
      UI.elements.submitBtn.classList.remove("hidden");
      UI.elements.formStatus.classList.add("hidden");
    } else {
      UI.elements.nextBtn.classList.remove("hidden");
      UI.elements.submitBtn.classList.add("hidden");
    }
  },

  updateCheckboxLabelColor: (checkboxId) => {
    const checkbox = document.getElementById(checkboxId);
    if (!checkbox) return;
    const label = checkbox.nextElementSibling; // Assuming the label is the next sibling
    if (!label) return;

    // Remove existing color classes, including initial gray-800
    label.classList.remove("text-green-600", "text-red-600", "text-gray-800");

    if (checkbox.checked) {
      label.classList.add("text-green-600");
    } else {
      label.classList.add("text-red-600");
    }
  },

  validateCurrentStep: () => {
    let isValid = true;
    let firstInvalidField = null;

    UI.elements.formStatus.classList.add("hidden");

    const currentStepDiv = document.querySelector(".form-step.active");
    // Validar todos los inputs requeridos o con valor en el paso actual
    const inputsToValidate = currentStepDiv.querySelectorAll(
      "input, select, textarea"
    );

    inputsToValidate.forEach((input) => {
      // Solo validar si es requerido o tiene valor (para validar formato)
      if (input.hasAttribute("data-required") || input.value.trim() !== "") {
        if (!Validator.validarCampo(input)) {
          isValid = false;
          if (!firstInvalidField) firstInvalidField = input;
        }
      }
    });

    // Validación específica de edad
    const fNacEstInput = document.getElementById("fNacEst");
    const edadEstInput = document.getElementById("edadEst");
    const edadWarning = document.getElementById("edadWarning");

    if (fNacEstInput && fNacEstInput.closest(".form-step.active")) {
      const currentAge = parseInt(edadEstInput.value, 10);
      if (
        isNaN(currentAge) ||
        currentAge < CONFIG.EDAD_MIN ||
        currentAge > CONFIG.EDAD_MAX
      ) {
        isValid = false;
        fNacEstInput.classList.add("invalid");
        edadWarning.textContent = `La edad debe estar entre ${CONFIG.EDAD_MIN} y ${CONFIG.EDAD_MAX} años.`;
        edadWarning.classList.remove("hidden");
        if (!firstInvalidField) firstInvalidField = fNacEstInput;
      } else {
        edadWarning.classList.add("hidden");
      }
    }

    if (!isValid) {
      UI.elements.formStatus.textContent =
        "Por favor, corrige los errores marcados.";
      UI.elements.formStatus.classList.remove("hidden");
      UI.elements.formStatus.classList.add("text-red-600");
      if (firstInvalidField) firstInvalidField.focus();
    }

    return isValid;
  },

  toggleHermanoInfo: () => {
    if (UI.elements.tieneHermSelect.value === "Sí") {
      UI.elements.hermanoInfo.classList.remove("hidden");
      // Hacer requeridos dinámicamente
      UI.elements.nomHerm.setAttribute("data-required", "true");
      UI.elements.anoHerm.setAttribute("data-required", "true");
    } else {
      UI.elements.hermanoInfo.classList.add("hidden");
      UI.elements.nomHerm.value = "";
      UI.elements.anoHerm.value = "";
      // Quitar requeridos
      UI.elements.nomHerm.removeAttribute("data-required");
      UI.elements.anoHerm.removeAttribute("data-required");
      Validator.limpiarError(UI.elements.nomHerm);
      Validator.limpiarError(UI.elements.anoHerm);
    }
  },

  populateSelects: () => {
    // Año Cursar
    const anoSelect = document.getElementById("ano_cursar");
    const currentYear = new Date().getFullYear();
    anoSelect.innerHTML = '<option value="">Selecciona un año</option>';
    for (let i = 0; i < 10; i++) {
      const start = currentYear + i;
      const option = document.createElement("option");
      option.value = `${start}-${start + 1}`;
      option.textContent = `${start}-${start + 1}`;
      anoSelect.appendChild(option);
    }

    // Estatura
    const estSelect = document.getElementById("estatura");
    estSelect.innerHTML = '<option value="">Selecciona</option>';
    for (let i = 100; i <= 200; i += 5) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `${i} cm`;
      estSelect.appendChild(option);
    }
  },

  setupInputRestrictions: () => {
    // Restricción de caracteres y conversión a Mayúsculas
    const restrictToNumbers = (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
    };
    const restrictToLetters = (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");
    };
    const toUpper = (e) => {
      e.target.value = e.target.value.toUpperCase();
    };

    document
      .querySelectorAll('input[type="text"], input[type="email"], textarea')
      .forEach((el) => {
        el.addEventListener("input", toUpper);
      });

    // Aplicar a campos específicos (IDs)
    [
      "ciEst",
      "ciMad",
      "ciPad",
      "ciRep",
      "telHabMad",
      "celMad",
      "telHabPad",
      "celPad",
      "telHabRep",
      "celRep",
      "contEmerg",
      "referencia",
      "montoPago",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", restrictToNumbers);
    });

    // Campos que solo deben permitir letras
    [
      "nomEst",
      "apeEst",
      "lugNacEst",
      "plantelProc",
      "enfDisc",
      "actInt",
      "nomHerm",
      "nomMad",
      "profMad",
      "trabMad",
      "cargoMad",
      "nomPad",
      "profPad",
      "trabPad",
      "cargoPad",
      "nomRep",
      "profRep",
      "trabRep",
      "cargoRep",
      "parentesco",
      "autRetirar",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", restrictToLetters);
    });
  },

  setupEventListeners: () => {
    // Modal de opciones
    UI.elements.continueBtn.addEventListener("click", () => {
      UI.elements.optionsModal.classList.add("hidden");
      UI.updateVisibleSteps();
    });

    // Búsqueda por C.I.
    ["ciEst", "ciMad", "ciPad", "ciRep"].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("blur", () => {
          const cedula = input.value.trim();
          UI.searchByCedula(cedula, id);
        });
      }
    });

    // Navegación
    UI.elements.nextBtn.addEventListener("click", () => {
      if (UI.validateCurrentStep()) {
        if (UI.state.currentStepIndex < UI.state.visibleSteps.length - 1) {
          UI.state.currentStepIndex++;
          UI.showCurrentStep();
        }
      }
    });

    UI.elements.prevBtn.addEventListener("click", () => {
      if (UI.state.currentStepIndex > 0) {
        UI.state.currentStepIndex--;
        UI.showCurrentStep();
      }
    });

    // Checkboxes de padres
    UI.elements.enableMadre.addEventListener("change", () => {
      UI.updateVisibleSteps();
      UI.updateCheckboxLabelColor("enableMadre");
    });
    UI.elements.enablePadre.addEventListener("change", () => {
      UI.updateVisibleSteps();
      UI.updateCheckboxLabelColor("enablePadre");
    });

    // Hermanos
    UI.elements.tieneHermSelect.addEventListener(
      "change",
      UI.toggleHermanoInfo
    );

    // Validación en tiempo real (Blur)
    document.querySelectorAll("input, select, textarea").forEach((input) => {
      input.addEventListener("blur", () => Validator.validarCampo(input));
      // Limpiar error al escribir
      input.addEventListener("input", () => {
        if (input.classList.contains("invalid")) Validator.validarCampo(input);
      });
    });

    // Cálculo de Edad
    const fNacEstInput = document.getElementById("fNacEst");
    fNacEstInput.addEventListener("change", () => {
      const birthDateStr = fNacEstInput.value;
      const edadEstInput = document.getElementById("edadEst");

      if (!birthDateStr) {
        edadEstInput.value = "";
        return;
      }
      const birthDate = new Date(birthDateStr);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      edadEstInput.value = age >= 0 ? age : "";
      // Validar inmediatamente
      UI.validateCurrentStep();
    });

    // Imagen
    UI.elements.fotoEstInput.addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          UI.elements.imagePreview.src = e.target.result;
          UI.elements.imagePreview.classList.remove("hidden");
          UI.elements.fotoEstBase64.value = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        UI.elements.imagePreview.classList.add("hidden");
        UI.elements.fotoEstBase64.value = "";
      }
    });

    // Envío del Formulario
    UI.elements.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!UI.validateCurrentStep()) return;

      // UI Loading
      const btnText = UI.elements.submitBtn.querySelector(".button-text");
      const spinner = UI.elements.submitBtn.querySelector(".animate-spin");
      btnText.classList.add("hidden");
      spinner.classList.remove("hidden");
      UI.elements.submitBtn.disabled = true;
      UI.elements.formStatus.textContent = "Generando ficha...";
      UI.elements.formStatus.classList.remove("hidden", "text-red-600");
      UI.elements.formStatus.classList.add("text-gray-800");

      try {
        const response = await fetch(CONFIG.SCRIPT_URL, {
          method: "POST",
          body: new FormData(UI.elements.form),
        });
        const data = await response.json();

        if (data.result === "success") {
          UI.elements.confirmationModal.classList.remove(
            "opacity-0",
            "pointer-events-none"
          );
          UI.elements.confirmationModal
            .querySelector(".transform")
            .classList.remove("scale-95");
        } else {
          throw new Error(data.error || "Error desconocido");
        }
      } catch (error) {
        console.error(error);
        UI.elements.formStatus.textContent = "Error: " + error.message;
        UI.elements.formStatus.classList.add("text-red-600");
        UI.elements.submitBtn.disabled = false;
        btnText.classList.remove("hidden");
        spinner.classList.add("hidden");
      }
    });

    // Cerrar Modal
    UI.elements.closeModalBtn.addEventListener("click", () => {
      location.reload(); // Recargar para limpiar todo
    });

    // Cerrar Modal de "No Encontrado"
    UI.elements.closeNotFoundModalBtn.addEventListener("click", () => {
      UI.elements.notFoundModal.classList.add("hidden");
    });

    // Cancelado Dropdown (Lógica personalizada)
    const cancelButton = document.getElementById("cancelado-button");
    const cancelOptions = document.getElementById("cancelado-options");
    const canceladoInput = document.getElementById("cancelado");
    const cancelCheckboxes = cancelOptions.querySelectorAll(
      'input[type="checkbox"]'
    );
    const cancelButtonText = cancelButton.querySelector("span");

    cancelButton.addEventListener("click", () =>
      cancelOptions.classList.toggle("hidden")
    );

    const updateCancelado = () => {
      const vals = [];
      const labels = [];
      cancelCheckboxes.forEach((cb) => {
        if (cb.checked) {
          vals.push(cb.value);
          labels.push(cb.nextElementSibling.textContent);
        }
      });
      canceladoInput.value = vals.join(", ");
      cancelButtonText.textContent =
        labels.length > 0 ? labels.join(", ") : "Selecciona";
    };
    cancelCheckboxes.forEach((cb) =>
      cb.addEventListener("change", updateCancelado)
    );

    document.addEventListener("click", (e) => {
      if (
        !cancelButton.contains(e.target) &&
        !cancelOptions.contains(e.target)
      ) {
        cancelOptions.classList.add("hidden");
      }
    });
  },
};

// INICIALIZAR
document.addEventListener("DOMContentLoaded", UI.init);


