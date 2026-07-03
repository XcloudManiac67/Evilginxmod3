package models

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/kgretzky/evilginx2/gophish/evilginx"
	check "gopkg.in/check.v1"
)

type mockTemplateContext struct {
	URL           string
	FromAddress   string
	EncryptionKey string
}

func (m mockTemplateContext) getFromAddress() string {
	return m.FromAddress
}

func (m mockTemplateContext) getBaseURL() string {
	return m.URL
}

func (m mockTemplateContext) getEncryptionKey() string {
	return m.EncryptionKey
}

func (s *ModelsSuite) TestNewTemplateContext(c *check.C) {
	r := Result{
		BaseRecipient: BaseRecipient{
			FirstName: "Foo",
			LastName:  "Bar",
			Email:     "foo@bar.com",
		},
		RId: "1234567",
	}
	ctx := mockTemplateContext{
		URL:           "http://example.com",
		FromAddress:   "From Address <from@example.com>",
		EncryptionKey: "",
	}
	expected := PhishingTemplateContext{
		URL:           fmt.Sprintf("%s?rid=%s", ctx.URL, r.RId),
		BaseURL:       ctx.URL,
		BaseRecipient: r.BaseRecipient,
		TrackingURL:   fmt.Sprintf("%s/track?rid=%s", ctx.URL, r.RId),
		From:          "From Address",
		RId:           r.RId,
	}
	expected.Tracker = "<img alt='' style='display: none' src='" + expected.TrackingURL + "'/>"
	got, err := NewPhishingTemplateContext(ctx, r.BaseRecipient, r.RId)
	c.Assert(err, check.Equals, nil)
	c.Assert(got, check.DeepEquals, expected)
}

func (s *ModelsSuite) TestNewTemplateContextWithHashPlaceholder(c *check.C) {
	r := Result{
		BaseRecipient: BaseRecipient{
			FirstName: "Foo",
			LastName:  "Bar",
			Email:     "foo@bar.com",
		},
		RId: "1234567",
	}
	ctx := mockTemplateContext{
		URL:           "http://example.com/path?foo=bar#[Email]",
		FromAddress:   "From Address <from@example.com>",
		EncryptionKey: "",
	}
	got, err := NewPhishingTemplateContext(ctx, r.BaseRecipient, r.RId)
	c.Assert(err, check.Equals, nil)
	c.Assert(strings.HasSuffix(got.URL, "#foo@bar.com"), check.Equals, true)
	parsed, err := url.Parse(got.URL)
	c.Assert(err, check.Equals, nil)
	c.Assert(parsed.Fragment, check.Equals, "foo@bar.com")
	query := parsed.Query()
	c.Assert(query.Get("foo"), check.Equals, "bar")
	var encodedParam string
	for k, values := range query {
		if k != "foo" {
			c.Assert(values, check.HasLen, 1)
			encodedParam = values[0]
		}
	}
	c.Assert(encodedParam, check.Not(check.Equals), "")
	decodedParams, ok, err := evilginx.ExtractPhishUrlParams(encodedParam, "")
	c.Assert(err, check.IsNil)
	c.Assert(ok, check.Equals, true)
	c.Assert(decodedParams["rid"], check.Equals, "1234567")
}
