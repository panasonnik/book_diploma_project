function editProfileWindow(username, email, languages) {
    const container = document.getElementById('container');
    container.innerHTML = `
    <h2 class="heading heading--bold">Edit profile</h2>
    <form action="/profile/edit" method="POST">
        <div class="form__field">
            <label class="form__field__label" for="username">Username</label>
            <input
              class="form__input-field"
              type="text"
              id="username"
              name="username"
              autocomplete="off"
              value=${username}
              required
            />
            <% if (errorUsername) { %>
            <span class="error-message" id="username-error" role="alert">
              <%= errorUsername %>
            </span>
            <% } %>
          </div>
          <div class="form__field">
            <label class="form__field__label" for="email">Email</label>
            <input
              class="form__input-field"
              type="text"
              id="email"
              name="email"
              autocomplete="off"
              value=${email}
              required
            />
            <% if (errorEmail) { %>
            <span class="error-message" id="email-error" role="alert">
              <%= errorEmail %>
            </span>
            <% } %>
          </div>
            </form>
    `;
  }
  