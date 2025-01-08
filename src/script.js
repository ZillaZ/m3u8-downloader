function pick_file() {
  const input_element = document.querySelector("#file-input")
  input_element.click()
}

let prefix = ""
let mode = "single"

function set_mode(new_mode) {
  mode = new_mode
  update_modes()
  display_mode()
}

function page_load() {
  update_prefix()
  update_modes()
  display_mode()
}

function update_modes() {
  const single_button = document.querySelector("#single-button")
  const raw_button = document.querySelector("#raw-button")
  if(mode == "single") {
    single_button.setAttribute("class", "active")
    raw_button.setAttribute("class", "")
  }else{
    raw_button.setAttribute("class", "active")
    single_button.setAttribute("class", "")
  }
}

function display_mode() {
  const single_editor = document.querySelector(".single-mode-editor")
  const raw_editor = document.querySelector(".raw-mode-editor")
  if(mode == "single") {
    single_editor.setAttribute("style", "")
    raw_editor.setAttribute("style", "display: none;")
  }else{
    raw_editor.setAttribute("style", "")
    single_editor.setAttribute("style", "display: none;")
  }
}

function update_prefix(event) {
  const input = document.querySelector("#prefix")
  prefix = input.value
  console.log(prefix)
}

async function read_file() {
  const input_element = document.querySelector("#file-input")
  const status = document.querySelector("#status")
  let progress = document.querySelector("#progress")
  const name = input_element.files[0].name.split(".")[0]
  const files = await input_element.files[0].text()
  const lines = files.split("\n")
  const ts_files = lines.filter((e) => !e.startsWith("#") && e.trim().length > 1).map((e) => prefix + e)
  const extension = ts_files[0].split(".").pop()
  const combined = []
  console.log(ts_files)
  let percentage = 0
  const headers = build_headers()
  status.setAttribute("data-status", "waiting")
  for(const url of ts_files) {
    const response = await fetch("http://127.0.0.1:2469", {
      method: "POST",
      body: headers + "Url:\n" + url
    })
    if(response.status >= 400) {
      status.innerText = "Status: Server Error. " + response.statusText
      status.setAttribute("data-status", "error")
      return
    }
    if(response.status == 202) {
      const text = await response.text()
      const code = text.split(" ")[0]
      const url = text.split(" ")[1]
      status.setAttribute("data-status", "warning")
      status.innerText = "Status: Download Error.\nError: " + code + "\nFor Url: " + url
      return
    }
    const array_buffer = await response.arrayBuffer()
    combined.push(array_buffer)
    percentage = (combined.length / ts_files.length) * 100
    progress.innerText = percentage.toFixed(2) + "%"
    status.innerText = "Status: " + combined.length + "/" + ts_files.length + " downloaded"
  }
  status.setAttribute("data-status", "success")
  status.innerText = "Status: Finished."
  const videoBlob = new Blob(combined, { type: "video/mp2t" });
  const url = URL.createObjectURL(videoBlob);
  const downloadLink = document.querySelector("#download-anchor");
  downloadLink.href = url;
  downloadLink.download = name + "." + extension;
  downloadLink.click();
  URL.revokeObjectURL(url);
}

function build_headers() {
  if(mode == "single") {
    const headers = document.querySelectorAll(".header-value")
    let index = 1
    let total = []
    while(headers.item(index)) {
      const header = headers.item(index)
      total.push(header.value)
    }
    return total.join("\n")
  }

  const headers = document.querySelector("textarea")
  return headers.value
}

function header_input_event(event) {
  if(event.key != "Enter") return;
  const source = document.querySelector("#main-input")
  if(source.value.trim().length < 3) {
    alert("Invalid header")
    return
  }
  const index = "i" + document.querySelectorAll(".header-value").length
  const div = document.querySelector(".single-mode-editor")
  let element = document.createElement("input")
  element.setAttribute("class", "header-value")
  element.setAttribute("id", index)
  const button = document.createElement("button")
  button.innerText = "X"
  button.setAttribute("id", "button_" + index)
  button.addEventListener("click", (event) => {
    const element = document.querySelector("#" + index)
    const button = document.querySelector("#button_" + index)
    element.remove()
    button.remove()
  })
  element.value = source.value
  source.innerText = ""
  const wrapper = document.createElement("div")
  wrapper.setAttribute("class", "headers")
  wrapper.appendChild(element)
  wrapper.appendChild(button)
  div.appendChild(wrapper)
}
